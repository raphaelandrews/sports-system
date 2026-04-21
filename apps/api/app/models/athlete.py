from datetime import date, datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class AthleteGender(str, Enum):
    M = "M"
    F = "F"


class Athlete(SQLModel, table=True):
    __tablename__ = "athletes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    name: str
    gender: Optional[AthleteGender] = None
    birthdate: Optional[date] = None
    code: str = Field(unique=True)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))


class AthleteModality(SQLModel, table=True):
    __tablename__ = "athlete_modalities"

    id: Optional[int] = Field(default=None, primary_key=True)
    athlete_id: int = Field(foreign_key="athletes.id")
    modality_id: int = Field(foreign_key="modalities.id")
    category: Optional[str] = None
