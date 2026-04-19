from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.user import NotificationType


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    notification_type: NotificationType
    payload: dict[str, Any]
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
