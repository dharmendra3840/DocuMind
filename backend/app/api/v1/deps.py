import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError

from app.db.session import get_db
from app.db.models.user import User
from app.core.security import decode_token
from app.core.exceptions import CredentialsException

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise CredentialsException
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise CredentialsException
        user_id: str = payload.get("sub")
        if not user_id:
            raise CredentialsException
    except JWTError:
        raise CredentialsException

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise CredentialsException
    return user
