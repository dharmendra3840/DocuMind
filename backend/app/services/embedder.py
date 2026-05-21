import openai as openai_lib
import asyncio
from sentence_transformers import SentenceTransformer
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
_openai_client = None
_embedding_model = None

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
BATCH_SIZE = 100


def get_openai_client() -> openai_lib.AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        kwargs = {"api_key": settings.openai_api_key}
        if settings.openai_base_url:
            kwargs["base_url"] = settings.openai_base_url
        _openai_client = openai_lib.AsyncOpenAI(**kwargs)
    return _openai_client


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    return _embedding_model


async def embed_texts(texts: list[str]) -> list[list[float]]:
    model = get_embedding_model()

    def encode_batch(batch):
        try:
            embeddings = model.encode(batch, convert_to_tensor=False)
            return [emb.tolist() for emb in embeddings]
        except Exception as e:
            logger.error("embedding_error", batch_size=len(batch), error=str(e))
            return [[0.0] * 384 for _ in batch]

    all_embeddings = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i:i + BATCH_SIZE]
        batch_embeddings = await asyncio.to_thread(encode_batch, batch)
        all_embeddings.extend(batch_embeddings)

    logger.info("embeddings_created", count=len(texts))
    return all_embeddings


async def embed_query(text: str) -> list[float]:
    embeddings = await embed_texts([text])
    return embeddings[0]
