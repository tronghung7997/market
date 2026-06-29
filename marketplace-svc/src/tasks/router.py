from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import require_role
from src.database import get_session
from src.models.account import Account
from src.models.service_task import ServiceTaskStatus

from . import schemas, service

router = APIRouter(tags=["tasks"])


@router.get("/admin/tasks", response_model=list[schemas.TaskResponse])
async def list_tasks(
    status: ServiceTaskStatus | None = Query(None),
    _: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_session),
):
    return await service.list_tasks(db, status=status)


@router.put("/admin/tasks/{task_id}", response_model=schemas.TaskResponse)
async def update_task(
    task_id: int,
    body: schemas.TaskUpdateRequest,
    _: Account = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_session),
):
    updates = body.model_dump(exclude_unset=True)
    return await service.update_task(task_id, updates, db)
