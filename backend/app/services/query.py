import json
import time
from typing import AsyncGenerator
from app.services.embedder import embed_query, get_openai_client
from app.services.vector_store import query_similar
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are DocuMind, an expert document analyst. Your job is to answer the user's question using ONLY the context excerpts provided below. Do not use any outside knowledge.

RULES:
1. Base your answer exclusively on the CONTEXT below.
2. Cite every fact using [filename, p.N] inline — e.g. "The warranty period is 12 months [contract_v2.pdf, p.14]."
3. If the context does not contain enough information, say exactly: "I could not find a clear answer in the provided documents."
4. Never fabricate, infer, or hallucinate information not present in the context.
5. Be concise but complete. Use bullet points for lists.

CONTEXT:
{context}

CONVERSATION HISTORY (last 6 turns for continuity):
{history}"""

QUERY_EXPANSION_PROMPT = """Given the following short or ambiguous user question, rewrite it as a detailed, self-contained search query that will retrieve the most relevant document passages. Do NOT add assumptions. Only clarify and expand what is implied.

Original question: {question}
Rewritten query:"""

TITLE_GENERATION_PROMPT = """Given this first exchange, generate a short title (< 6 words) for the conversation. Do not use quotes or punctuation.

User: {first_user_message}
Assistant: {first_assistant_response}
Title:"""


def _describe_llm_error(e: Exception) -> str:
    err = str(e).lower()
    status = getattr(e, "status_code", None)
    if status == 401 or "invalid_api_key" in err or "invalid api key" in err:
        return "The AI service rejected its API key. The site owner needs to update it."
    if status == 402 or "insufficient_quota" in err or "credits" in err:
        return "The AI service is out of credits. The site owner needs to top up the account."
    if status == 404 or "model_not_found" in err or "does not exist" in err:
        return "The configured AI model isn't available. The site owner needs to update LLM_MODEL."
    if status == 429 or "rate limit" in err:
        return "The AI service is busy right now. Please wait a moment and try again."
    return "The AI service couldn't answer right now. Please try again."


def _format_context(chunks: list[dict]) -> str:
    parts = []
    for chunk in chunks:
        parts.append(
            f"[Source: {chunk['filename']} | Page {chunk['page_number']} | Chunk {chunk['chunk_index']}]\n{chunk['text']}"
        )
    return "\n---\n".join(parts)


def _format_history(messages: list[dict]) -> str:
    if not messages:
        return "No prior conversation."
    lines = []
    for msg in messages[-6:]:
        role = "User" if msg["role"] == "user" else "Assistant"
        lines.append(f"{role}: {msg['content'][:500]}")
    return "\n".join(lines)


def _needs_expansion(query: str, history: list[dict]) -> bool:
    words = query.split()
    pronouns = {"it", "that", "they", "this", "them", "those", "these", "he", "she"}
    has_pronoun = any(w.lower() in pronouns for w in words)
    return len(words) < 10 or has_pronoun


def _llm_options() -> dict:
    # Only sent when configured: non-reasoning models reject reasoning_effort.
    if settings.llm_reasoning_effort:
        return {"extra_body": {"reasoning_effort": settings.llm_reasoning_effort}}
    return {}


# Reasoning models spend part of max_tokens thinking before they answer, so the
# short helper calls get generous budgets even though their output is tiny.
HELPER_MAX_TOKENS = 600


async def _expand_query(query: str) -> str:
    client = get_openai_client()
    response = await client.chat.completions.create(
        model=settings.fast_model,
        messages=[{"role": "user", "content": QUERY_EXPANSION_PROMPT.format(question=query)}],
        max_tokens=HELPER_MAX_TOKENS,
        temperature=0,
        **_llm_options(),
    )
    expanded = (response.choices[0].message.content or "").strip()
    logger.info("query_expanded", original=query, expanded=expanded)
    # An empty rewrite (e.g. the budget went to reasoning) must not replace the question.
    return expanded or query


async def generate_conversation_title(first_user_message: str, first_assistant_response: str) -> str:
    client = get_openai_client()
    response = await client.chat.completions.create(
        model=settings.fast_model,
        messages=[{"role": "user", "content": TITLE_GENERATION_PROMPT.format(
            first_user_message=first_user_message,
            first_assistant_response=first_assistant_response[:200],
        )}],
        max_tokens=HELPER_MAX_TOKENS,
        temperature=0,
        **_llm_options(),
    )
    return (response.choices[0].message.content or "").strip().strip('"').strip()


async def stream_rag_response(
    workspace_id: str,
    query: str,
    history: list[dict],
    include_sources: bool = True,
    doc_ids: list[str] | None = None,
) -> AsyncGenerator[str, None]:
    start_time = time.time()

    search_query = query
    if _needs_expansion(query, history):
        try:
            search_query = await _expand_query(query)
        except Exception:
            pass

    query_embedding = await embed_query(search_query)
    chunks = await query_similar(workspace_id, query_embedding, k=4, doc_ids=doc_ids)

    context = _format_context(chunks) if chunks else "No relevant document chunks found."
    history_text = _format_history(history)

    client = get_openai_client()
    full_response = ""

    try:
        stream = await client.chat.completions.create(
            model=settings.llm_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(context=context, history=history_text)},
                {"role": "user", "content": query},
            ],
            max_tokens=2000,
            temperature=0.1,
            stream=True,
            **_llm_options(),
        )

        async for chunk in stream:
            # Some providers end with a usage-only chunk that has no choices.
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta.content
            if delta:
                # gpt-oss cites with 【…】; keep the [file, p.N] style the prompt asks for.
                delta = delta.replace("【", "[").replace("】", "]")
                full_response += delta
                yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"

    except Exception as e:
        # Full provider error goes to the logs; users get a short, non-technical
        # message as an `error` event, which is never saved as an answer.
        logger.error("llm_stream_error", model=settings.llm_model, error=str(e))
        yield f"data: {json.dumps({'type': 'error', 'message': _describe_llm_error(e)})}\n\n"
        return

    if include_sources and chunks:
        sources = [
            {"filename": c["filename"], "page": c["page_number"], "chunk_index": c["chunk_index"], "text": c["text"][:300]}
            for c in chunks
        ]
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    latency_ms = int((time.time() - start_time) * 1000)
    yield f"data: {json.dumps({'type': 'done', 'latency_ms': latency_ms, 'full_response': full_response})}\n\n"
