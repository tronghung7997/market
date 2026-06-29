from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class ServiceTaskStatus(str, PyEnum):
    pending = "pending"
    assigned = "assigned"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class ServiceTask(Base):
    __tablename__ = "service_tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    platform: Mapped[str] = mapped_column(String(50), nullable=False)
    target_url: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[ServiceTaskStatus] = mapped_column(
        Enum(ServiceTaskStatus), default=ServiceTaskStatus.pending
    )
    assignee: Mapped[str | None] = mapped_column(String(100), nullable=True)
    result_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
