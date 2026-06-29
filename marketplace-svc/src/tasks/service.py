from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.service_task import ServiceTask, ServiceTaskStatus


async def list_tasks(
    db: AsyncSession,
    *,
    status: ServiceTaskStatus | None = None,
) -> list[ServiceTask]:
    q = select(ServiceTask).order_by(ServiceTask.created_at.desc())
    if status is not None:
        q = q.where(ServiceTask.status == status)
    result = await db.execute(q)
    return list(result.scalars().all())


async def update_task(
    task_id: int,
    updates: dict,
    db: AsyncSession,
) -> ServiceTask:
    task = await db.get(ServiceTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for key, value in updates.items():
        if value is not None:
            setattr(task, key, value)

    await db.commit()
    await db.refresh(task)
    return task
