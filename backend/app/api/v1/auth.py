from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.workspace import Workspace
from app.db.models.refresh_token import RefreshToken
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import CredentialsException, ConflictException
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, AccessTokenResponse, RefreshTokenRequest, UserOut
from app.api.v1.deps import get_current_user
from jose import JWTError

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise ConflictException("Email already registered")

    user = User(email=data.email, hashed_password=hash_password(data.password), name=data.name)
    db.add(user)
    await db.flush()

    workspace = Workspace(user_id=user.id, name="My Workspace", pinecone_namespace=str(user.id))
    db.add(workspace)

    access_token = create_access_token(str(user.id))
    refresh_token_str, expires_at = create_refresh_token(str(user.id))
    refresh_token = RefreshToken(user_id=user.id, token=refresh_token_str, expires_at=expires_at)
    db.add(refresh_token)

    await db.commit()
    await db.refresh(user)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token_str, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(str(user.id))
    refresh_token_str, expires_at = create_refresh_token(str(user.id))
    db.add(RefreshToken(user_id=user.id, token=refresh_token_str, expires_at=expires_at))
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token_str, user=UserOut.model_validate(user))


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(data.refresh_token)
        if payload.get("type") != "refresh":
            raise CredentialsException
        user_id = payload.get("sub")
    except JWTError:
        raise CredentialsException

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == data.refresh_token, RefreshToken.is_revoked == False)
    )
    token_record = result.scalar_one_or_none()
    if not token_record or token_record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise CredentialsException

    token_record.is_revoked = True
    new_access = create_access_token(user_id)
    new_refresh_str, new_expires = create_refresh_token(user_id)
    db.add(RefreshToken(user_id=token_record.user_id, token=new_refresh_str, expires_at=new_expires))
    await db.commit()

    return AccessTokenResponse(access_token=new_access)


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RefreshToken).where(RefreshToken.token == data.refresh_token))
    token_record = result.scalar_one_or_none()
    if token_record:
        token_record.is_revoked = True
        await db.commit()
    return {"message": "Logged out successfully"}
