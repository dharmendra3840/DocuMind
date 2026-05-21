from pydantic import BaseModel
import uuid
from datetime import datetime


class WorkspaceCreate(BaseModel):
    name: str


class WorkspaceUpdate(BaseModel):
    name: str


class WorkspaceOut(BaseModel):
    id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceListResponse(BaseModel):
    workspaces: list[WorkspaceOut]
