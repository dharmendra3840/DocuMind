from pydantic import BaseModel
import uuid
from datetime import datetime
from app.db.models.conversation import MessageRole, MessageFeedback


class ConversationCreate(BaseModel):
    workspace_id: uuid.UUID
    title: str | None = None


class ConversationOut(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    title: str | None
    message_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    conversations: list[ConversationOut]


class SourceOut(BaseModel):
    filename: str
    page: int
    chunk_index: int
    text: str


class MessageOut(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    content: str
    sources: list[SourceOut] | None
    feedback: MessageFeedback | None
    latency_ms: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageListResponse(BaseModel):
    messages: list[MessageOut]
    total: int


class QueryRequest(BaseModel):
    message: str
    include_sources: bool = True
    doc_ids: list[str] | None = None


class FeedbackRequest(BaseModel):
    rating: MessageFeedback
    comment: str | None = None
