import uuid
import json
import time
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.db.session import get_db, AsyncSessionLocal
from app.db.models.user import User
from app.db.models.workspace import Workspace
from app.db.models.conversation import Conversation, Message, MessageRole
from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.conversation import (
    ConversationCreate, ConversationOut, ConversationListResponse,
    MessageOut, MessageListResponse, QueryRequest, FeedbackRequest
)
from app.services.query import stream_rag_response, generate_conversation_title
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Titles the frontend/backend assign before the first exchange; replaced by an
# LLM-generated title once the first answer is in.
PLACEHOLDER_TITLES = {None, "", "New Conversation"}


async def _get_workspace_or_403(workspace_id: uuid.UUID, user: User, db: AsyncSession) -> Workspace:
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise NotFoundException("Workspace not found")
    if workspace.user_id != user.id:
        raise ForbiddenException
    return workspace


@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_workspace_or_403(workspace_id, current_user, db)
    result = await db.execute(
        select(Conversation)
        .where(Conversation.workspace_id == workspace_id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()
    return ConversationListResponse(conversations=[ConversationOut.model_validate(c) for c in conversations])


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_workspace_or_403(data.workspace_id, current_user, db)
    conv = Conversation(workspace_id=data.workspace_id, title=data.title or "New Conversation")
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return ConversationOut.model_validate(conv)


@router.get("/{conv_id}/messages", response_model=MessageListResponse)
async def get_messages(
    conv_id: uuid.UUID,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
    await _get_workspace_or_403(conv.workspace_id, current_user, db)

    offset = (page - 1) * limit
    msg_result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
        .offset(offset).limit(limit)
    )
    messages = msg_result.scalars().all()
    count_result = await db.execute(select(func.count()).select_from(Message).where(Message.conversation_id == conv_id))
    total = count_result.scalar_one()
    return MessageListResponse(messages=[MessageOut.model_validate(m) for m in messages], total=total)


@router.post("/{conv_id}/query")
async def query_conversation(
    conv_id: uuid.UUID,
    data: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
    workspace = await _get_workspace_or_403(conv.workspace_id, current_user, db)

    history_result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id)
        .order_by(Message.created_at.desc()).limit(12)
    )
    history_messages = list(reversed(history_result.scalars().all()))
    history = [{"role": m.role.value, "content": m.content} for m in history_messages]

    user_msg = Message(conversation_id=conv_id, role=MessageRole.user, content=data.message)
    db.add(user_msg)
    await db.commit()

    async def event_generator():
        full_response = ""
        sources = []
        latency_ms = 0
        start = time.time()

        try:
            async for event in stream_rag_response(str(workspace.id), data.message, history, data.include_sources, data.doc_ids):
                yield event
                parsed = json.loads(event.removeprefix("data: ").strip())
                if parsed["type"] == "token":
                    full_response += parsed["content"]
                elif parsed["type"] == "sources":
                    sources = parsed["sources"]
                elif parsed["type"] == "done":
                    latency_ms = parsed.get("latency_ms", int((time.time() - start) * 1000))
        except Exception as e:
            logger.error("query_stream_failed", conversation_id=str(conv_id), error=repr(e))
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
            return

        # The request-scoped `db` session is already closed by the time the
        # response body streams, so persist with a session of our own.
        async with AsyncSessionLocal() as session:
            assistant_msg = Message(
                conversation_id=conv_id,
                role=MessageRole.assistant,
                content=full_response,
                sources=sources if sources else None,
                latency_ms=latency_ms,
                model="llama-3.3-70b-versatile",
            )
            session.add(assistant_msg)
            conv_row = await session.get(Conversation, conv_id)
            needs_title = False
            if conv_row is not None:
                needs_title = (conv_row.message_count or 0) == 0 and conv_row.title in PLACEHOLDER_TITLES
                conv_row.message_count = (conv_row.message_count or 0) + 2
            await session.commit()
            message_id = assistant_msg.id

        yield f"data: {json.dumps({'type': 'message_saved', 'message_id': str(message_id)})}\n\n"

        # Name the conversation after its first exchange only; done after
        # message_saved so the answer isn't held up by a second LLM call.
        if needs_title and full_response:
            try:
                title = (await generate_conversation_title(data.message, full_response)).strip()[:255]
                if title:
                    async with AsyncSessionLocal() as session:
                        await session.execute(update(Conversation).where(Conversation.id == conv_id).values(title=title))
                        await session.commit()
            except Exception:
                logger.warning("conversation_title_failed", conversation_id=str(conv_id))

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@router.delete("/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conv_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
    await _get_workspace_or_403(conv.workspace_id, current_user, db)
    await db.delete(conv)
    await db.commit()


@router.patch("/{conv_id}", response_model=ConversationOut)
async def rename_conversation(
    conv_id: uuid.UUID,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
    await _get_workspace_or_403(conv.workspace_id, current_user, db)
    if "title" in data:
        conv.title = data["title"]
    await db.commit()
    await db.refresh(conv)
    return ConversationOut.model_validate(conv)


@router.delete("/{conv_id}/messages/{msg_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    conv_id: uuid.UUID,
    msg_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
    await _get_workspace_or_403(conv.workspace_id, current_user, db)
    msg_result = await db.execute(select(Message).where(Message.id == msg_id, Message.conversation_id == conv_id))
    msg = msg_result.scalar_one_or_none()
    if not msg:
        raise NotFoundException("Message not found")
    await db.delete(msg)
    await db.commit()


@router.post("/{conv_id}/messages/{msg_id}/feedback", response_model=MessageOut)
async def rate_message(
    conv_id: uuid.UUID,
    msg_id: uuid.UUID,
    data: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Conversation).where(Conversation.id == conv_id))
    conv = result.scalar_one_or_none()
    if not conv:
        raise NotFoundException("Conversation not found")
    await _get_workspace_or_403(conv.workspace_id, current_user, db)

    msg_result = await db.execute(select(Message).where(Message.id == msg_id, Message.conversation_id == conv_id))
    msg = msg_result.scalar_one_or_none()
    if not msg:
        raise NotFoundException("Message not found")

    msg.feedback = data.rating
    await db.commit()
    await db.refresh(msg)
    return MessageOut.model_validate(msg)
