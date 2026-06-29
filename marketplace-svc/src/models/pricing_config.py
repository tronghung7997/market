from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class PricingConfig(Base):
    __tablename__ = "pricing_configs"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_type: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    strategy: Mapped[str] = mapped_column(String(50), nullable=False)
    params: Mapped[dict] = mapped_column(JSON, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
