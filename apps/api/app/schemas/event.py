from datetime import date, datetime, time
from typing import Any, Optional

from pydantic import BaseModel

from app.models.event import EventPhase, EventStatus, MatchEventType, MatchStatus, ParticipantRole


class EventCreate(BaseModel):
    competition_id: int
    modality_id: int
    event_date: date
    start_time: time
    venue: Optional[str] = None
    phase: EventPhase


class EventUpdate(BaseModel):
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    venue: Optional[str] = None
    phase: Optional[EventPhase] = None
    status: Optional[EventStatus] = None


class EventResponse(BaseModel):
    id: int
    competition_id: int
    modality_id: int
    event_date: date
    start_time: time
    venue: Optional[str]
    phase: EventPhase
    status: EventStatus

    model_config = {"from_attributes": True}


class MatchParticipantResponse(BaseModel):
    id: int
    match_id: int
    athlete_id: int
    delegation_id_at_time: int
    role: ParticipantRole

    model_config = {"from_attributes": True}


class MatchEventResponse(BaseModel):
    id: int
    match_id: int
    minute: Optional[int]
    event_type: MatchEventType
    athlete_id: Optional[int]
    delegation_id_at_time: Optional[int]
    value_json: Optional[dict[str, Any]]
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchResponse(BaseModel):
    id: int
    event_id: int
    team_a_delegation_id: Optional[int]
    team_b_delegation_id: Optional[int]
    athlete_a_id: Optional[int]
    athlete_b_id: Optional[int]
    score_a: Optional[int]
    score_b: Optional[int]
    winner_delegation_id: Optional[int]
    winner_athlete_id: Optional[int]
    status: MatchStatus
    started_at: Optional[datetime]
    ended_at: Optional[datetime]

    model_config = {"from_attributes": True}


class MatchDetailResponse(MatchResponse):
    participants: list[MatchParticipantResponse] = []
    events: list[MatchEventResponse] = []


class EventDetailResponse(EventResponse):
    matches: list[MatchResponse] = []


class MatchEventCreate(BaseModel):
    minute: Optional[int] = None
    event_type: MatchEventType
    athlete_id: Optional[int] = None
    delegation_id_at_time: Optional[int] = None
    value_json: Optional[dict[str, Any]] = None
