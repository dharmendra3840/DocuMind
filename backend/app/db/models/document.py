import uuid
from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.db.session import Base


class DocumentStatus(str, enum.Enum):
    UPLOADING = "UPLOADING"
    PROCESSING = "PROCESSING"
    READY = "READY"
    FAILED = "FAILED"


class FileType(str, enum.Enum):
    pdf = "pdf"
    docx = "docx"
    txt = "txt"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    filename: Mapped[str] = mapped_column(String, nullable=False)
    s3_key: Mapped[str | None] = mapped_column(String)
    file_type: Mapped[FileType] = mapped_column(Enum(FileType), nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    page_count: Mapped[int | None] = mapped_column(Integer)
    chunk_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[DocumentStatus] = mapped_column(Enum(DocumentStatus), default=DocumentStatus.UPLOADING, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="documents")
