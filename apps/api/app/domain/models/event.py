from datetime import date, datetime, time, timezone
from enum import Enum
from typing import Any, Optional

from sqlalchemy import JSON, Column, Date, Time
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel


class EventPhase(str, Enum):
    GROUPS = "GROUPS"
    QUARTER = "QUARTER"
    SEMI = "SEMI"
    FINAL = "FINAL"
    BRONZE = "BRONZE"


class EventStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MatchStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class ParticipantRole(str, Enum):
    PLAYER = "PLAYER"
    CAPTAIN = "CAPTAIN"
    SUBSTITUTE = "SUBSTITUTE"


class MatchEventType(str, Enum):
    GOAL = "GOAL"
    CARD_YELLOW = "CARD_YELLOW"
    CARD_RED = "CARD_RED"
    POINT = "POINT"
    PENALTY = "PENALTY"
    SUBSTITUTION = "SUBSTITUTION"
    SET_END = "SET_END"
    IPPON = "IPPON"
    WAZA_ARI = "WAZA_ARI"


class Event(SQLModel, table=True):
    __tablename__ = "events"

    id: Optional[int] = Field(default=None, primary_key=True)
    competition_id: int = Field(foreign_key="competitions.id")
    modality_id: int = Field(foreign_key="modalities.id")
    event_date: date = Field(sa_column=Column("date", Date, nullable=False))
    start_time: time = Field(sa_column=Column("time", Time, nullable=False))
    venue: Optional[str] = None
    phase: EventPhase
    status: EventStatus = Field(default=EventStatus.SCHEDULED)


class Match(SQLModel, table=True):
    __tablename__ = "matches"

    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="events.id")
    team_a_delegation_id: Optional[int] = Field(default=None, foreign_key="delegations.id")
    team_b_delegation_id: Optional[int] = Field(default=None, foreign_key="delegations.id")
    athlete_a_id: Optional[int] = Field(default=None, foreign_key="athletes.id")
    athlete_b_id: Optional[int] = Field(default=None, foreign_key="athletes.id")
    score_a: Optional[int] = None
    score_b: Optional[int] = None
    score_detail_json: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    winner_delegation_id: Optional[int] = Field(default=None, foreign_key="delegations.id")
    winner_athlete_id: Optional[int] = Field(default=None, foreign_key="athletes.id")
    status: MatchStatus = Field(default=MatchStatus.SCHEDULED)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class MatchParticipant(SQLModel, table=True):
    __tablename__ = "match_participants"

    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="matches.id")
    athlete_id: int = Field(foreign_key="athletes.id")
    delegation_id_at_time: int = Field(foreign_key="delegations.id")
    role: ParticipantRole


class MatchEvent(SQLModel, table=True):
    __tablename__ = "match_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    match_id: int = Field(foreign_key="matches.id")
    minute: Optional[int] = None
    event_type: MatchEventType = Field(
        sa_column=Column("type", SAEnum(MatchEventType, name="matcheventtype"), nullable=False)
    )
    athlete_id: Optional[int] = Field(default=None, foreign_key="athletes.id")
    delegation_id_at_time: Optional[int] = Field(default=None, foreign_key="delegations.id")
    value_json: Optional[dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
