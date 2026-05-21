import hashlib
import base64
import bcrypt
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from app.config import settings


def _prepare(password: str) -> bytes:
    # SHA-256 pre-hash keeps input within bcrypt's 72-byte limit
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    return base64.b64encode(digest)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prepare(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(_prepare(plain), hashed.encode("utf-8"))


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    return jwt.encode({"sub": subject, "exp": expire, "type": "access"}, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str) -> tuple[str, datetime]:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
    token = jwt.encode({"sub": subject, "exp": expire, "type": "refresh"}, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, expire


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
