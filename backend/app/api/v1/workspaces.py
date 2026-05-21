import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models.user import User
from app.db.models.workspace import Workspace
from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException, ForbiddenException
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceOut, WorkspaceListResponse

router = APIRouter()


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.user_id == current_user.id).order_by(Workspace.created_at))
    workspaces = result.scalars().all()
    return WorkspaceListResponse(workspaces=[WorkspaceOut.model_validate(w) for w in workspaces])


@router.post("", response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
async def create_workspace(data: WorkspaceCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    workspace = Workspace(user_id=current_user.id, name=data.name, pinecone_namespace=str(uuid.uuid4()))
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)
    return WorkspaceOut.model_validate(workspace)


@router.patch("/{workspace_id}", response_model=WorkspaceOut)
async def update_workspace(workspace_id: uuid.UUID, data: WorkspaceUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise NotFoundException("Workspace not found")
    if workspace.user_id != current_user.id:
        raise ForbiddenException
    workspace.name = data.name
    await db.commit()
    await db.refresh(workspace)
    return WorkspaceOut.model_validate(workspace)


@router.delete("/{workspace_id}", status_code=status.HTTP_200_OK)
async def delete_workspace(workspace_id: uuid.UUID, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    workspace = result.scalar_one_or_none()
    if not workspace:
        raise NotFoundException("Workspace not found")
    if workspace.user_id != current_user.id:
        raise ForbiddenException
    await db.delete(workspace)
    await db.commit()
    return {"message": "Workspace deleted"}
