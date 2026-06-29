from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.log_entry import LogEntry


async def log_event(
    db: AsyncSession, level: str, message: str, *,
    request_id: str | None = None, job_id: str | None = None, metadata: dict | None = None,
) -> None:
    db.add(LogEntry(
        service="marketplace-svc", level=level, message=message,
        request_id=request_id, job_id=job_id, metadata_=metadata,
    ))


async def query_logs(
    db: AsyncSession, *, request_id: str | None = None, job_id: str | None = None,
    order_id: int | None = None, level: str | None = None, limit: int = 100,
) -> list[LogEntry]:
    stmt = select(LogEntry)
    if request_id:
        stmt = stmt.where(LogEntry.request_id == request_id)
    if job_id:
        stmt = stmt.where(LogEntry.job_id == job_id)
    if level:
        stmt = stmt.where(LogEntry.level == level)
    if order_id is not None:
        stmt = stmt.where(LogEntry.metadata_["order_id"].astext == str(order_id))
    stmt = stmt.order_by(LogEntry.created_at.desc(), LogEntry.id.desc()).limit(limit)
    return list((await db.execute(stmt)).scalars().all())
