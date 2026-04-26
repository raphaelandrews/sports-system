from datetime import date, time
from typing import Optional

from pydantic import BaseModel

from app.domain.models.event import EventPhase, EventStatus


class GlobalSearchAthleteItem(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool

    model_config = {"from_attributes": True}


class GlobalSearchDelegationItem(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool

    model_config = {"from_attributes": True}


class GlobalSearchEventItem(BaseModel):
    id: int
    competition_id: int
    number: int
    sport_name: str
    modality_name: str
    venue: Optional[str]
    event_date: date
    start_time: time
    phase: EventPhase
    status: EventStatus


class GlobalSearchResponse(BaseModel):
    query: str
    athletes: list[GlobalSearchAthleteItem]
    delegations: list[GlobalSearchDelegationItem]
    events: list[GlobalSearchEventItem]
