from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str
