from pydantic import BaseModel
import uuid
from datetime import datetime
from app.db.models.document import DocumentStatus, FileType


class DocumentOut(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    filename: str
    file_type: FileType
    file_size_bytes: int | None
    page_count: int | None
    chunk_count: int | None
    status: DocumentStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentStatusResponse(BaseModel):
    status: DocumentStatus
    progress_pct: int
    error: str | None = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentOut]
    total: int


class ChunkOut(BaseModel):
    chunk_index: int
    page_number: int
    text: str


class ChunkListResponse(BaseModel):
    chunks: list[ChunkOut]
    total: int
