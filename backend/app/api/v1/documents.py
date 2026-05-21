import uuid
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.document import Document, DocumentStatus, FileType
from app.db.models.workspace import Workspace
from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.document import DocumentOut, DocumentStatusResponse, DocumentListResponse, ChunkOut, ChunkListResponse
from app.services.ingestion import run_ingestion, delete_document
from app.config import settings

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


def _get_file_type(filename: str, content_type: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if content_type in ALLOWED_MIME_TYPES:
        return ALLOWED_MIME_TYPES[content_type]
    if ext in ALLOWED_EXTENSIONS:
        return ext
    raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")


async def _get_workspace_or_403(workspace_id: uuid.UUID, user: User, db: AsyncSession) -> Workspace:
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise NotFoundException("Workspace not found")
    if workspace.user_id != user.id:
        raise ForbiddenException
    return workspace


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    workspace_id: uuid.UUID = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace = await _get_workspace_or_403(workspace_id, current_user, db)

    if file.size and file.size > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_size_mb}MB limit")

    file_type = _get_file_type(file.filename or "file.txt", file.content_type or "")
    file_bytes = await file.read()

    if len(file_bytes) > settings.max_upload_size_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_size_mb}MB limit")

    doc = Document(
        workspace_id=workspace.id,
        filename=file.filename or "document",
        file_type=FileType(file_type),
        file_size_bytes=len(file_bytes),
        status=DocumentStatus.UPLOADING,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    background_tasks.add_task(
        run_ingestion,
        doc.id,
        file_bytes,
        doc.filename,
        file_type,
        str(workspace.id),
        db,
    )

    return DocumentOut.model_validate(doc)


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    workspace_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_workspace_or_403(workspace_id, current_user, db)

    offset = (page - 1) * limit
    result = await db.execute(
        select(Document)
        .where(Document.workspace_id == workspace_id)
        .order_by(Document.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    docs = result.scalars().all()

    count_result = await db.execute(
        select(func.count()).select_from(Document).where(Document.workspace_id == workspace_id)
    )
    total = count_result.scalar_one()

    return DocumentListResponse(documents=[DocumentOut.model_validate(d) for d in docs], total=total)


@router.get("/{doc_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundException("Document not found")

    await _get_workspace_or_403(doc.workspace_id, current_user, db)

    progress = {
        DocumentStatus.UPLOADING: 10,
        DocumentStatus.PROCESSING: 50,
        DocumentStatus.READY: 100,
        DocumentStatus.FAILED: 0,
    }.get(doc.status, 0)

    return DocumentStatusResponse(status=doc.status, progress_pct=progress, error=doc.error_message)


@router.get("/{doc_id}/chunks", response_model=ChunkListResponse)
async def get_document_chunks(
    doc_id: uuid.UUID,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundException("Document not found")
    await _get_workspace_or_403(doc.workspace_id, current_user, db)

    from app.services.vector_store import get_chroma_client, get_or_create_chroma_collection
    try:
        client = get_chroma_client()
        collection = get_or_create_chroma_collection(client, str(doc.workspace_id))
        results = collection.get(where={"doc_id": str(doc_id)}, include=["metadatas", "documents"])
        chunks = []
        if results["metadatas"]:
            offset = (page - 1) * limit
            for meta, text in zip(results["metadatas"][offset:offset+limit], results["documents"][offset:offset+limit]):
                chunks.append(ChunkOut(
                    chunk_index=meta.get("chunk_index", 0),
                    page_number=meta.get("page_number", 0),
                    text=text,
                ))
        return ChunkListResponse(chunks=chunks, total=len(results["metadatas"] or []))
    except Exception:
        return ChunkListResponse(chunks=[], total=0)


@router.delete("/{doc_id}")
async def delete_doc(
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise NotFoundException("Document not found")
    await _get_workspace_or_403(doc.workspace_id, current_user, db)
    await delete_document(doc_id, str(doc.workspace_id), doc.s3_key, db)
    return {"message": "Document deleted"}
