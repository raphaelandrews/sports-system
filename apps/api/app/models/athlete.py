from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Athlete(SQLModel, table=True):
    __tablename__ = "athletes"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    name: str
    birthdate: Optional[date] = None
    code: str = Field(unique=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AthleteModality(SQLModel, table=True):
    __tablename__ = "athlete_modalities"

    id: Optional[int] = Field(default=None, primary_key=True)
    athlete_id: int = Field(foreign_key="athletes.id")
    modality_id: int = Field(foreign_key="modalities.id")
    category: Optional[str] = None
