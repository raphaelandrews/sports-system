from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from sqlalchemy import JSON, Column
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel


class SportType(str, Enum):
    INDIVIDUAL = "INDIVIDUAL"
    TEAM = "TEAM"


class Gender(str, Enum):
    M = "M"
    F = "F"
    MIXED = "MIXED"


class Sport(SQLModel, table=True):
    __tablename__ = "sports"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    # Column named "type" in DB
    sport_type: SportType = Field(
        sa_column=Column("type", SAEnum(SportType, name="sporttype"), nullable=False)
    )
    description: Optional[str] = None
    rules_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    player_count: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Modality(SQLModel, table=True):
    __tablename__ = "modalities"

    id: Optional[int] = Field(default=None, primary_key=True)
    sport_id: int = Field(foreign_key="sports.id")
    name: str
    gender: Gender
    category: Optional[str] = None
    rules_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
