import json
import re
import time
from typing import AsyncGenerator
from app.services.embedder import embed_query, get_openai_client
from app.services.vector_store import query_similar
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

# Fixed sentence for "the documents don't answer this": the prompt asks for it
# verbatim so we can detect it and skip showing sources.
NOT_FOUND = "I couldn't find this in your documents."

SYSTEM_PROMPT = """You are DocuMind, an assistant that answers questions using the user's own documents.

Below are numbered passages retrieved from the user's documents. Answer using ONLY these passages. Never use outside knowledge and never guess.

How to answer:
- Open with a direct answer to the question in one or two sentences.
- Add supporting detail only when it helps: short paragraphs, or bullet points for lists, steps, or comparisons. Use a small table only when comparing several items across the same attributes.
- Bold the key facts: numbers, dates, names, obligations.
- When exact wording matters (definitions, clauses, requirements), quote it briefly.
- Cite the passage behind each claim with its number in square brackets right after the sentence, e.g. "The notice period is 60 days [2]." Use several when needed, e.g. [1][3]. Only cite numbers listed below, never bold them, and don't write file names or page numbers yourself; the numbers link to the sources.
- Say "your documents", never "passages", "excerpts", or "context". No preamble such as "Based on the documents".
- If the passages only partly answer the question, answer that part and say plainly what isn't covered.
- If the passages don't answer the question at all, reply with exactly: "{not_found}" Then add one short sentence on what your documents do cover that is closest to the question, with citations, so the user can rephrase.
- Keep it concise.

Passages:
{context}"""

SMALL_TALK_PROMPT = """You are DocuMind, an assistant that answers questions about the user's own documents and cites the page each answer comes from.

The user's message is small talk (a greeting, thanks, or a question about what you can do), not a question about their documents. Reply warmly in at most three short sentences:
- respond naturally to what they said;
- say what you can do for them;
- {documents_hint}

Do not state any facts from the documents. No lists or headings."""

QUERY_EXPANSION_PROMPT = """Rewrite this short or ambiguous question as a self-contained search query for finding relevant passages in the user's documents. Only clarify what is implied; do not add assumptions such as a document type or topic that isn't mentioned. Reply with the query only.

Question: {question}"""

TITLE_GENERATION_PROMPT = """Given this first exchange, generate a short title (< 6 words) for the conversation. Do not use quotes or punctuation.

User: {first_user_message}
Assistant: {first_assistant_response}
Title:"""

_SMALL_TALK = re.compile(
    r"^\s*(?:"
    r"h+i+|hello+|hey+|hiya|yo|greetings|good\s+(?:morning|afternoon|evening|day)"
    r"|thanks?(?:\s+(?:you|a lot|so much))*|thank\s+you(?:\s+so\s+much)?|thx|ty|cheers"
    r"|ok(?:ay)?|cool|great|nice|awesome|bye|goodbye|see\s+you"
    r"|who\s+are\s+you|what\s+are\s+you|what\s+(?:can|do)\s+you\s+do|how\s+do(?:es)?\s+(?:this|it|you)\s+work|help"
    r")(?:\s+(?:there|docu\s*mind|again))?\s*[!.?]*\s*$",
    re.IGNORECASE,
)

# [3], [1, 2], and gpt-oss style [3†L4-L9] (its 【…】 brackets are normalised to [ ] while streaming).
CITATION_RE = re.compile(r"\[(\d{1,2}(?:\s*,\s*\d{1,2})*)(?:†[^\]]*)?\]")


def is_small_talk(message: str) -> bool:
    return bool(_SMALL_TALK.match(message))


def _cited_numbers(text: str) -> set[int]:
    return {int(n) for group in CITATION_RE.findall(text) for n in group.split(",")}


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
    return "\n\n".join(
        f"[{n}] {c['filename']}, page {c['page_number']}\n{c['text']}" for n, c in enumerate(chunks, 1)
    )


def _history_messages(history: list[dict]) -> list[dict]:
    """Recent turns as real chat messages, so follow-ups like "and for cause?" resolve."""
    return [
        {"role": m["role"], "content": m["content"][:1500]}
        for m in history[-6:]
        if m.get("content")
    ]


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


async def _stream_completion(messages: list[dict], temperature: float) -> AsyncGenerator[str, None]:
    """Yields text deltas; raises on provider errors."""
    client = get_openai_client()
    stream = await client.chat.completions.create(
        model=settings.llm_model,
        messages=messages,
        max_tokens=2000,
        temperature=temperature,
        stream=True,
        **_llm_options(),
    )
    async for chunk in stream:
        # Some providers end with a usage-only chunk that has no choices.
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta.content
        if delta:
            # gpt-oss writes citations as 【…】; normalise to the [n] style we render.
            yield delta.replace("【", "[").replace("】", "]")


def _event(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def stream_rag_response(
    workspace_id: str,
    query: str,
    history: list[dict],
    include_sources: bool = True,
    doc_ids: list[str] | None = None,
    doc_names: list[str] | None = None,
) -> AsyncGenerator[str, None]:
    start_time = time.time()
    small_talk = is_small_talk(query)
    chunks: list[dict] = []

    if small_talk:
        if doc_names:
            listed = ", ".join(doc_names[:5]) + (f" and {len(doc_names) - 5} more" if len(doc_names) > 5 else "")
            hint = f"mention they can ask about their documents ({listed}) and suggest one example question based on a file name."
        else:
            hint = "mention they haven't uploaded any documents yet and can add PDF, Word, or text files on the Documents page."
        messages = [
            {"role": "system", "content": SMALL_TALK_PROMPT.format(documents_hint=hint)},
            *_history_messages(history),
            {"role": "user", "content": query},
        ]
    else:
        search_query = query
        if _needs_expansion(query, history):
            try:
                # Keep the user's own words in the search alongside the rewrite,
                # so a rewrite that drifts can't lose the original intent.
                search_query = f"{query}\n{await _expand_query(query)}"
            except Exception:
                pass
        query_embedding = await embed_query(search_query)
        chunks = await query_similar(workspace_id, query_embedding, k=4, doc_ids=doc_ids)
        context = _format_context(chunks) if chunks else "(No passages were found in the user's documents.)"
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(context=context, not_found=NOT_FOUND)},
            *_history_messages(history),
            {"role": "user", "content": query},
        ]

    full_response = ""
    try:
        async for delta in _stream_completion(messages, temperature=0.4 if small_talk else 0.1):
            full_response += delta
            yield _event({"type": "token", "content": delta})
    except Exception as e:
        # Full provider error goes to the logs; users get a short, non-technical
        # message as an `error` event, which is never saved as an answer.
        logger.error("llm_stream_error", model=settings.llm_model, error=str(e))
        yield _event({"type": "error", "message": _describe_llm_error(e)})
        return

    if include_sources and chunks:
        # Show only the passages the answer actually cites (keeping their numbers,
        # so [2] in the text matches chip 2). If nothing is cited, show all of
        # them — unless the answer is "not found", where they'd only mislead.
        cited = _cited_numbers(full_response)
        numbered = list(enumerate(chunks, 1))
        if cited:
            selected = [(n, c) for n, c in numbered if n in cited]
        elif full_response.strip().startswith(NOT_FOUND):
            selected = []
        else:
            selected = numbered
        if selected:
            sources = [
                {"n": n, "filename": c["filename"], "page": c["page_number"], "chunk_index": c["chunk_index"], "text": c["text"][:2000]}
                for n, c in selected
            ]
            yield _event({"type": "sources", "sources": sources})

    latency_ms = int((time.time() - start_time) * 1000)
    yield _event({"type": "done", "latency_ms": latency_ms, "full_response": full_response})
