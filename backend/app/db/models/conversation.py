import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.db.session import Base


class MessageRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


class MessageFeedback(str, enum.Enum):
    up = "up"
    down = "down"


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[MessageRole] = mapped_column(Enum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sources: Mapped[list | None] = mapped_column(JSONB)
    feedback: Mapped[MessageFeedback | None] = mapped_column(Enum(MessageFeedback), nullable=True)
    latency_ms: Mapped[int | None] = mapped_column(Integer)
    model: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
