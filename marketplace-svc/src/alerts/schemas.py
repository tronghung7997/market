from datetime import datetime

from pydantic import BaseModel


class AlertResponse(BaseModel):
    id: int
    type: str
    severity: str
    target_type: str
    target_id: int
    message: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
