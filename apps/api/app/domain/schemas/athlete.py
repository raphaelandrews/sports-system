from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.domain.models.athlete import AthleteGender


class AthleteCreate(BaseModel):
    name: str
    code: str
    gender: Optional[AthleteGender] = None
    birthdate: Optional[date] = None
    user_id: Optional[int] = None


class AthleteUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[AthleteGender] = None
    birthdate: Optional[date] = None
    is_active: Optional[bool] = None


class AthleteResponse(BaseModel):
    id: int
    name: str
    code: str
    gender: Optional[AthleteGender]
    birthdate: Optional[date]
    is_active: bool
    user_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class DelegationHistoryItem(BaseModel):
    delegation_id: int
    delegation_name: str
    delegation_code: str
    role: str
    joined_at: datetime
    left_at: Optional[datetime]


class MatchHistoryItem(BaseModel):
    match_id: int
    event_id: int
    modality_name: str
    sport_name: str
    delegation_code: str
    role: str
    match_date: Optional[date]


class AthleteHistoryResponse(BaseModel):
    delegation_history: list[DelegationHistoryItem]
    match_history: list[MatchHistoryItem]


class AthleteStatisticsResponse(BaseModel):
    athlete_id: int
    total_matches: int
    modalities: list[str]
    raw: list[dict]
