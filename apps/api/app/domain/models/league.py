from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Column
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel


class LeagueStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"


class LeagueMode(str, Enum):
    NORMAL = "NORMAL"
    SPEED = "SPEED"


class LeagueMemberRole(str, Enum):
    LEAGUE_ADMIN = "LEAGUE_ADMIN"
    CHIEF = "CHIEF"
    COACH = "COACH"
    ATHLETE = "ATHLETE"


class League(SQLModel, table=True):
    __tablename__ = "leagues"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    description: Optional[str] = None
    created_by_id: int = Field(foreign_key="users.id")
    sports_config: list[int] = Field(
        default_factory=list, sa_column=Column(JSON, nullable=False)
    )
    auto_simulate: bool = Field(default=False)
    transfer_window_enabled: bool = Field(default=False)
    timezone: str = Field(default="America/Sao_Paulo")
    status: LeagueStatus = Field(
        default=LeagueStatus.ACTIVE,
        sa_column=Column(SAEnum(LeagueStatus, name="leaguestatus"), nullable=False),
    )
    mode: LeagueMode = Field(
        default=LeagueMode.NORMAL,
        sa_column=Column(SAEnum(LeagueMode, name="leaguemode"), nullable=False),
    )
    match_duration_seconds: int = Field(default=300)
    schedule_interval_seconds: int = Field(default=300)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class LeagueMember(SQLModel, table=True):
    __tablename__ = "league_members"

    id: Optional[int] = Field(default=None, primary_key=True)
    league_id: int = Field(foreign_key="leagues.id")
    user_id: int = Field(foreign_key="users.id")
    role: LeagueMemberRole = Field(
        sa_column=Column(
            SAEnum(LeagueMemberRole, name="leaguememberrole"), nullable=False
        )
    )
    joined_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    left_at: Optional[datetime] = None
