from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class Medal(str, Enum):
    GOLD = "GOLD"
    SILVER = "SILVER"
    BRONZE = "BRONZE"


class Result(SQLModel, table=True):
    __tablename__ = "results"

    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="matches.id")
    delegation_id: Optional[int] = Field(default=None, foreign_key="delegations.id")
    athlete_id: Optional[int] = Field(default=None, foreign_key="athletes.id")
    rank: int
    medal: Optional[Medal] = None
    value_json: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))


class AthleteStatistic(SQLModel, table=True):
    __tablename__ = "athlete_statistics"

    id: Optional[int] = Field(default=None, primary_key=True)
    athlete_id: int = Field(foreign_key="athletes.id")
    sport_id: int = Field(foreign_key="sports.id")
    week_id: int = Field(foreign_key="competition_weeks.id")
    stats_json: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))


class Record(SQLModel, table=True):
    __tablename__ = "records"

    id: Optional[int] = Field(default=None, primary_key=True)
    modality_id: int = Field(foreign_key="modalities.id")
    athlete_id: int = Field(foreign_key="athletes.id")
    delegation_id_at_time: int = Field(foreign_key="delegations.id")
    value: str
    week_id: int = Field(foreign_key="competition_weeks.id")
    set_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
