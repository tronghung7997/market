from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class LogEntry(Base):
    __tablename__ = "log_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    service: Mapped[str] = mapped_column(String(50), nullable=False)
    level: Mapped[str] = mapped_column(String(20), nullable=False)
    request_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    job_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
