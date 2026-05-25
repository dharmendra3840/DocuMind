import base64
import hashlib
import hmac
import json
import secrets
import time
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.security import create_access_token, create_refresh_token, hash_password
from app.db.models.refresh_token import RefreshToken
from app.db.models.user import User
from app.db.models.workspace import Workspace
from app.db.session import get_db

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

router = APIRouter()


def _make_state(nonce: str) -> str:
    ts = str(int(time.time()))
    msg = f"{ts}.{nonce}"
    sig = hmac.new(settings.jwt_secret_key.encode(), msg.encode(), hashlib.sha256).hexdigest()
    return f"{msg}.{sig}"


def _verify_state(state: str, max_age: int = 300) -> bool:
    try:
        # format: timestamp.nonce.signature  (nonce has no dots; sig is hex)
        idx1 = state.index(".")
        idx2 = state.rindex(".")
        if idx1 == idx2:
            return False
        ts_str = state[:idx1]
        nonce = state[idx1 + 1 : idx2]
        sig = state[idx2 + 1 :]
        msg = f"{ts_str}.{nonce}"
        expected = hmac.new(settings.jwt_secret_key.encode(), msg.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return False
        if int(time.time()) - int(ts_str) > max_age:
            return False
        return True
    except Exception:
        return False


@router.get("/google/authorize")
async def google_authorize():
    if not settings.google_client_id:
        return RedirectResponse(f"{settings.frontend_url}/?auth_error=not_configured")

    nonce = secrets.token_urlsafe(16)
    state = _make_state(nonce)

    params = urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": f"{settings.backend_url}/api/v1/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    })
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{params}")


@router.get("/google/callback")
async def google_callback(
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    if error:
        return RedirectResponse(f"{settings.frontend_url}/?auth_error={error}")

    if not state or not _verify_state(state):
        return RedirectResponse(f"{settings.frontend_url}/?auth_error=invalid_state")

    if not code:
        return RedirectResponse(f"{settings.frontend_url}/?auth_error=no_code")

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": f"{settings.backend_url}/api/v1/auth/google/callback",
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            return RedirectResponse(f"{settings.frontend_url}/?auth_error=token_exchange_failed")

        google_access = token_resp.json().get("access_token")

        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {google_access}"},
        )
        userinfo = userinfo_resp.json()

    email = userinfo.get("email")
    name = userinfo.get("name") or userinfo.get("given_name") or ""

    if not email or not userinfo.get("email_verified"):
        return RedirectResponse(f"{settings.frontend_url}/?auth_error=email_not_verified")

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            name=name,
        )
        db.add(user)
        await db.flush()
        db.add(Workspace(user_id=user.id, name="My Workspace", pinecone_namespace=str(user.id)))

    # Issue our JWT tokens
    jwt_access = create_access_token(str(user.id))
    refresh_str, expires_at = create_refresh_token(str(user.id))
    db.add(RefreshToken(user_id=user.id, token=refresh_str, expires_at=expires_at))
    await db.commit()

    # Pass user payload to frontend as base64url JSON so it can hydrate the store
    user_b64 = base64.urlsafe_b64encode(
        json.dumps({"id": str(user.id), "email": user.email, "name": user.name or ""}).encode()
    ).decode().rstrip("=")

    params = urlencode({"token": jwt_access, "refresh": refresh_str, "user": user_b64})
    return RedirectResponse(f"{settings.frontend_url}/auth/callback?{params}")
