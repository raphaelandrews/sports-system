from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class EnrollmentStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Enrollment(SQLModel, table=True):
    __tablename__ = "enrollments"

    id: Optional[int] = Field(default=None, primary_key=True)
    athlete_id: int = Field(foreign_key="athletes.id")
    event_id: int = Field(foreign_key="events.id")
    delegation_id: int = Field(foreign_key="delegations.id")
    status: EnrollmentStatus = Field(default=EnrollmentStatus.PENDING)
    validation_message: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
