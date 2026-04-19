from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enrollment import EnrollmentStatus


class EnrollmentCreate(BaseModel):
    athlete_id: int
    event_id: int
    delegation_id: int


class EnrollmentReview(BaseModel):
    status: EnrollmentStatus
    validation_message: Optional[str] = None


class EnrollmentResponse(BaseModel):
    id: int
    athlete_id: int
    event_id: int
    delegation_id: int
    status: EnrollmentStatus
    validation_message: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
