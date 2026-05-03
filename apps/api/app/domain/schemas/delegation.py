from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.domain.models.delegation import (
    DelegationMemberRole,
    DelegationStatus,
    InviteStatus,
)
from app.domain.models.result import Medal


class DelegationCreate(BaseModel):
    name: str
    code: Optional[str] = None
    flag_url: Optional[str] = None


class DelegationUpdate(BaseModel):
    name: Optional[str] = None
    flag_url: Optional[str] = None

    def has_updates(self) -> bool:
        return self.name is not None or self.flag_url is not None


class DelegationResponse(BaseModel):
    id: int
    league_id: Optional[int]
    code: str
    name: str
    flag_url: Optional[str]
    chief_id: Optional[int]
    is_active: bool
    status: DelegationStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberInfo(BaseModel):
    id: int
    user_id: int
    user_name: str
    role: DelegationMemberRole
    joined_at: datetime
    left_at: Optional[datetime]


class DelegationDetailResponse(DelegationResponse):
    members: list[MemberInfo]


class MemberHistoryItem(BaseModel):
    id: int
    user_id: int
    user_name: str
    role: DelegationMemberRole
    joined_at: datetime
    left_at: Optional[datetime]


class InviteCreate(BaseModel):
    user_id: int


class InviteResponse(BaseModel):
    id: int
    delegation_id: int
    user_id: int
    status: InviteStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DelegationAthleteStatisticsItem(BaseModel):
    athlete_id: int
    athlete_name: str
    athlete_code: str
    is_active: bool
    is_current_member: bool
    joined_at: Optional[datetime]
    left_at: Optional[datetime]
    total_matches: int
    gold: int
    silver: int
    bronze: int
    total_medals: int


class DelegationMedalItem(BaseModel):
    result_id: int
    athlete_id: Optional[int]
    athlete_name: Optional[str]
    match_id: int
    rank: int
    medal: Medal


class DelegationWeekPerformanceItem(BaseModel):
    competition_id: int
    number: int
    status: str
    start_date: date
    end_date: date
    matches_played: int
    matches_completed: int
    wins: int
    gold: int
    silver: int
    bronze: int
    total_medals: int


class DelegationStatisticsResponse(BaseModel):
    delegation: DelegationResponse
    athlete_count: int
    active_athlete_count: int
    total_matches: int
    total_wins: int
    gold: int
    silver: int
    bronze: int
    total_medals: int
    athletes: list[DelegationAthleteStatisticsItem]
    medals: list[DelegationMedalItem]
    weekly_performance: list[DelegationWeekPerformanceItem]


class LeagueParticipationRequestCreate(BaseModel):
    league_id: int


class LeagueParticipationRequestReview(BaseModel):
    status: DelegationStatus


class LeagueParticipationRequestResponse(BaseModel):
    id: int
    delegation_id: int
    league_id: int
    requested_by: int
    status: DelegationStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class DelegationAIGenerateRequest(BaseModel):
    prompt: str
    count: int = Field(default=5, ge=1, le=10)
