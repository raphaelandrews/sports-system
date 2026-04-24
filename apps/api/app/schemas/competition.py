from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, model_validator

from app.models.competition import CompetitionStatus


class CompetitionCreate(BaseModel):
    number: int
    start_date: date
    end_date: date
    sport_focus: list[int] = []

    @model_validator(mode="after")
    def check_dates(self) -> "CompetitionCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class CompetitionUpdate(BaseModel):
    number: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sport_focus: Optional[list[int]] = None


class CompetitionResponse(BaseModel):
    id: int
    number: int
    start_date: date
    end_date: date
    status: CompetitionStatus
    sport_focus: list[Any]

    model_config = {"from_attributes": True}


class SchedulePreviewMatch(BaseModel):
    modality_id: int
    modality_name: str
    team_a: str
    team_b: str


class GenerateSchedulePreview(BaseModel):
    competition_id: int
    matches: list[SchedulePreviewMatch]
