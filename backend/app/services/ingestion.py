import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models.document import Document, DocumentStatus
from app.db.models.workspace import Workspace
from app.utils.file_parser import extract_text
from app.services.chunker import split_text_into_chunks
from app.services.embedder import embed_texts
from app.services.vector_store import upsert_chunks, delete_document_vectors
from app.services.storage import upload_file, delete_file
from app.utils.logger import get_logger

logger = get_logger(__name__)


async def run_ingestion(doc_id: uuid.UUID, file_bytes: bytes, filename: str, file_type: str, workspace_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        return

    try:
        doc.status = DocumentStatus.PROCESSING
        await db.commit()

        s3_key = await upload_file(file_bytes, filename, doc_id)
        doc.s3_key = s3_key

        text, page_count = extract_text(file_bytes, file_type)

        if len(text.strip()) < 50:
            raise ValueError("No extractable text found. The document may be a scanned image. Try OCR.")

        chunks = split_text_into_chunks(text)
        if not chunks:
            raise ValueError("No text chunks could be extracted from the document.")

        chunk_dicts = [{"text": c.text, "page_number": c.page_number, "chunk_index": c.chunk_index, "filename": filename} for c in chunks]
        texts = [c.text for c in chunks]
        embeddings = await embed_texts(texts)

        await upsert_chunks(workspace_id, str(doc_id), chunk_dicts, embeddings)

        doc.status = DocumentStatus.READY
        doc.page_count = page_count
        doc.chunk_count = len(chunks)
        await db.commit()

        logger.info("ingestion_complete", doc_id=str(doc_id), chunks=len(chunks), pages=page_count)

    except Exception as e:
        logger.error("ingestion_failed", doc_id=str(doc_id), error=str(e))
        result = await db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if doc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)
            await db.commit()


async def delete_document(doc_id: uuid.UUID, workspace_id: str, s3_key: str | None, db: AsyncSession) -> None:
    await delete_document_vectors(workspace_id, str(doc_id))
    if s3_key:
        await delete_file(s3_key)
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if doc:
        await db.delete(doc)
        await db.commit()
