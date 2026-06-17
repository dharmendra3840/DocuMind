from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # OpenAI / OpenRouter
    openai_api_key: str = ""
    openai_base_url: str = ""

    # Vector Store
    vector_store: str = "chroma"
    pinecone_api_key: str = ""
    pinecone_index_name: str = "documind-prod"
    pinecone_environment: str = "us-east-1"

    # Chroma
    chroma_host: str = "localhost"
    chroma_port: int = 8001

    # Database
    database_url: str = "postgresql+asyncpg://documind:documind_pass@localhost:5432/documind"

    @property
    def async_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        return url

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    jwt_secret_key: str = "changeme"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # Storage
    storage_backend: str = "local"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_s3_bucket: str = "documind-uploads"
    aws_region: str = "us-east-1"
    local_upload_dir: str = "uploads"

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    # CORS
    allowed_origins: str = "http://localhost:3000"
    allowed_origin_regex: str = ""

    # Rate limiting
    rate_limit_queries_per_min: int = 20
    rate_limit_uploads_per_hour: int = 5
    max_upload_size_mb: int = 50

    @property
    def allowed_origins_list(self) -> List[str]:
        origins = [o.strip() for o in self.allowed_origins.split(",") if o.strip()]
        # Always allow frontend_url so setting FRONTEND_URL on Railway is enough
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url)
        return origins

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


settings = Settings()
