import json
import time
from typing import AsyncGenerator
from app.services.embedder import embed_query, get_openai_client
from app.services.vector_store import query_similar
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


async def _expand_query(query: str) -> str:
    client = get_openai_client()
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": QUERY_EXPANSION_PROMPT.format(question=query)}],
        max_tokens=200,
        temperature=0,
    )
    expanded = response.choices[0].message.content.strip()
    logger.info("query_expanded", original=query, expanded=expanded)
    return expanded


async def generate_conversation_title(first_user_message: str, first_assistant_response: str) -> str:
    client = get_openai_client()
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": TITLE_GENERATION_PROMPT.format(
            first_user_message=first_user_message,
            first_assistant_response=first_assistant_response[:200],
        )}],
        max_tokens=20,
        temperature=0,
    )
    return response.choices[0].message.content.strip()


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
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(context=context, history=history_text)},
                {"role": "user", "content": query},
            ],
            max_tokens=2000,
            temperature=0.1,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                full_response += delta
                yield f"data: {json.dumps({'type': 'token', 'content': delta})}\n\n"

    except Exception as e:
        logger.error("openai_stream_error", error=str(e))
        err = str(e)
        if "insufficient_quota" in err.lower():
            msg = "OpenAI quota exceeded. Please add credits at platform.openai.com/billing."
        elif "429" in err or "rate" in err.lower():
            msg = "Rate limit reached — please wait a moment and try again."
        elif "401" in err or "invalid_api_key" in err.lower():
            msg = "Invalid OpenAI API key. Please check the OPENAI_API_KEY in your .env file."
        else:
            msg = f"OpenAI API error: {err[:200]}"
        yield f"data: {json.dumps({'type': 'token', 'content': msg})}\n\n"

    if include_sources and chunks:
        sources = [
            {"filename": c["filename"], "page": c["page_number"], "chunk_index": c["chunk_index"], "text": c["text"][:300]}
            for c in chunks
        ]
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

    latency_ms = int((time.time() - start_time) * 1000)
    yield f"data: {json.dumps({'type': 'done', 'latency_ms': latency_ms, 'full_response': full_response})}\n\n"
