from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import settings
from app.api.v1 import auth, workspaces, documents, conversations
from app.db.session import engine, Base
from app.utils.logger import get_logger

logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    logger.info("Starting DocuMind API")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Pre-warm embedding model so first query doesn't stall
    try:
        from app.services.embedder import get_embedding_model
        await asyncio.to_thread(get_embedding_model)
        logger.info("embedding_model_ready")
    except Exception as e:
        logger.warning("embedding_model_warmup_failed", error=str(e))
    yield
    logger.info("Shutting down DocuMind API")
    await engine.dispose()


app = FastAPI(
    title="DocuMind API",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_origin_regex=settings.allowed_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["workspaces"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(conversations.router, prefix="/api/v1/conversations", tags=["conversations"])


@app.get("/health")
async def health():
    return {"status": "ok"}
