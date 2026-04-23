from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel

from app.schemas.athlete import AthleteResponse, DelegationHistoryItem, MatchHistoryItem
from app.schemas.result import MedalBoardEntry, RecordResponse, ResultResponse


class CompetitionSummary(BaseModel):
    total_delegations: int
    total_athletes: int
    total_weeks: int
    total_events: int
    total_matches: int
    completed_matches: int


class AthleteBySportEntry(BaseModel):
    sport_id: int
    sport_name: str
    athlete_count: int


class FinalReportResponse(BaseModel):
    medal_board: list[MedalBoardEntry]
    records: list[RecordResponse]
    summary: CompetitionSummary
    athletes_by_sport: list[AthleteBySportEntry]


class WeekSummary(BaseModel):
    total_events: int
    completed_matches: int
    total_matches: int


class WeekReportResponse(BaseModel):
    week_id: int
    week_number: int
    status: str
    start_date: date
    end_date: date
    medal_board: list[MedalBoardEntry]
    summary: WeekSummary


class AthleteReportResponse(BaseModel):
    athlete: AthleteResponse
    delegation_history: list[DelegationHistoryItem]
    match_history: list[MatchHistoryItem]
    medals: list[ResultResponse]
    statistics: dict[str, Any]


class NarrativeResponse(BaseModel):
    id: int
    narrative_date: date
    content: str
    generated_at: datetime

    model_config = {"from_attributes": True}


class AIGenerationResponse(BaseModel):
    id: int
    generation_type: str
    count: int
    created_at: datetime

    model_config = {"from_attributes": True}
