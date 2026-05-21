import uuid
from typing import Any
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_chroma_client():
    import chromadb
    # PersistentClient stores data locally in the container volume — avoids
    # the HttpClient tenant-validation race condition in chromadb 0.5.x
    return chromadb.PersistentClient(path="/app/chroma_data")


def get_or_create_chroma_collection(client, workspace_id: str):
    safe_name = f"workspace_{workspace_id.replace('-', '_')}"
    return client.get_or_create_collection(name=safe_name, metadata={"hnsw:space": "cosine"})


async def upsert_chunks(
    workspace_id: str,
    doc_id: str,
    chunks: list[dict],
    embeddings: list[list[float]],
) -> None:
    if settings.vector_store == "pinecone":
        await _upsert_pinecone(workspace_id, doc_id, chunks, embeddings)
    else:
        _upsert_chroma(workspace_id, doc_id, chunks, embeddings)


async def query_similar(workspace_id: str, query_embedding: list[float], k: int = 4, doc_ids: list[str] | None = None) -> list[dict]:
    if settings.vector_store == "pinecone":
        return await _query_pinecone(workspace_id, query_embedding, k, doc_ids)
    else:
        return _query_chroma(workspace_id, query_embedding, k, doc_ids)


async def delete_document_vectors(workspace_id: str, doc_id: str) -> None:
    if settings.vector_store == "pinecone":
        await _delete_pinecone(workspace_id, doc_id)
    else:
        _delete_chroma(workspace_id, doc_id)


# ── Chroma ──────────────────────────────────────────────────────────────────────

def _upsert_chroma(workspace_id: str, doc_id: str, chunks: list[dict], embeddings: list[list[float]]) -> None:
    client = get_chroma_client()
    collection = get_or_create_chroma_collection(client, workspace_id)
    ids = [f"{doc_id}_{c['chunk_index']}" for c in chunks]
    metadatas = [{
        "doc_id": doc_id,
        "workspace_id": workspace_id,
        "filename": c["filename"],
        "page_number": c["page_number"],
        "chunk_index": c["chunk_index"],
        "chunk_text": c["text"][:500],
    } for c in chunks]
    documents = [c["text"] for c in chunks]
    collection.upsert(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=documents)
    logger.info("chroma_upserted", count=len(chunks), doc_id=doc_id)


def _query_chroma(workspace_id: str, query_embedding: list[float], k: int, doc_ids: list[str] | None = None) -> list[dict]:
    client = get_chroma_client()
    collection = get_or_create_chroma_collection(client, workspace_id)
    where = None
    if doc_ids and len(doc_ids) == 1:
        where = {"doc_id": doc_ids[0]}
    elif doc_ids and len(doc_ids) > 1:
        where = {"doc_id": {"$in": doc_ids}}
    query_kwargs: dict = {"query_embeddings": [query_embedding], "n_results": k, "include": ["metadatas", "documents", "distances"]}
    if where:
        query_kwargs["where"] = where
    results = collection.query(**query_kwargs)
    chunks = []
    if results["metadatas"]:
        for meta, doc in zip(results["metadatas"][0], results["documents"][0]):
            chunks.append({
                "filename": meta.get("filename", ""),
                "page_number": meta.get("page_number", 0),
                "chunk_index": meta.get("chunk_index", 0),
                "text": doc,
            })
    return chunks


def _delete_chroma(workspace_id: str, doc_id: str) -> None:
    client = get_chroma_client()
    collection = get_or_create_chroma_collection(client, workspace_id)
    results = collection.get(where={"doc_id": doc_id})
    if results["ids"]:
        collection.delete(ids=results["ids"])
    logger.info("chroma_deleted", doc_id=doc_id)


# ── Pinecone ────────────────────────────────────────────────────────────────────

def _get_pinecone_index():
    from pinecone import Pinecone, ServerlessSpec
    pc = Pinecone(api_key=settings.pinecone_api_key)
    existing = [idx.name for idx in pc.list_indexes()]
    if settings.pinecone_index_name not in existing:
        pc.create_index(
            name=settings.pinecone_index_name,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        logger.info("pinecone_index_created", name=settings.pinecone_index_name)
    return pc.Index(settings.pinecone_index_name)


async def _upsert_pinecone(workspace_id: str, doc_id: str, chunks: list[dict], embeddings: list[list[float]]) -> None:
    index = _get_pinecone_index()
    vectors = []
    for chunk, emb in zip(chunks, embeddings):
        vectors.append({
            "id": f"{doc_id}_{chunk['chunk_index']}",
            "values": emb,
            "metadata": {
                "doc_id": doc_id,
                "workspace_id": workspace_id,
                "filename": chunk["filename"],
                "page_number": chunk["page_number"],
                "chunk_index": chunk["chunk_index"],
                "chunk_text": chunk["text"][:500],
            }
        })
    for i in range(0, len(vectors), 100):
        index.upsert(vectors=vectors[i:i+100], namespace=workspace_id)
    logger.info("pinecone_upserted", count=len(vectors), doc_id=doc_id)


async def _query_pinecone(workspace_id: str, query_embedding: list[float], k: int, doc_ids: list[str] | None = None) -> list[dict]:
    index = _get_pinecone_index()
    filter_dict = {"doc_id": {"$in": doc_ids}} if doc_ids else None
    results = index.query(vector=query_embedding, top_k=k, namespace=workspace_id, include_metadata=True, filter=filter_dict)
    chunks = []
    for match in results["matches"]:
        meta = match["metadata"]
        chunks.append({
            "filename": meta.get("filename", ""),
            "page_number": meta.get("page_number", 0),
            "chunk_index": meta.get("chunk_index", 0),
            "text": meta.get("chunk_text", ""),
        })
    return chunks


async def _delete_pinecone(workspace_id: str, doc_id: str) -> None:
    index = _get_pinecone_index()
    index.delete(filter={"doc_id": doc_id}, namespace=workspace_id)
    logger.info("pinecone_deleted", doc_id=doc_id)
