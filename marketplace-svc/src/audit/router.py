from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import require_role
from src.database import get_session
from src.models.account import Account

from . import schemas, service

router = APIRouter(tags=["audit"])


@router.get("/admin/logs", response_model=list[schemas.LogEntryResponse])
async def list_logs(
    request_id: str | None = None, job_id: str | None = None,
    order_id: int | None = None, level: str | None = None, limit: int = 100,
    _: Account = Depends(require_role("admin")), db: AsyncSession = Depends(get_session),
):
    return await service.query_logs(db, request_id=request_id, job_id=job_id, order_id=order_id, level=level, limit=limit)
