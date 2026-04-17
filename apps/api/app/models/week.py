from datetime import date
from enum import Enum
from typing import Any, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class WeekStatus(str, Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    LOCKED = "LOCKED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class CompetitionWeek(SQLModel, table=True):
    __tablename__ = "competition_weeks"

    id: Optional[int] = Field(default=None, primary_key=True)
    week_number: int
    start_date: date
    end_date: date
    status: WeekStatus = Field(default=WeekStatus.DRAFT)
    sport_focus: list[Any] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
