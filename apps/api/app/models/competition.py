from datetime import date
from enum import Enum
from typing import Any, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class CompetitionStatus(str, Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    LOCKED = "LOCKED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"


class Competition(SQLModel, table=True):
    __tablename__ = "competitions"

    id: Optional[int] = Field(default=None, primary_key=True)
    league_id: int = Field(foreign_key="leagues.id")
    number: int
    start_date: date
    end_date: date
    status: CompetitionStatus = Field(default=CompetitionStatus.DRAFT)
    sport_focus: list[Any] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
