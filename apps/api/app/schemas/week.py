from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, model_validator

from app.models.week import WeekStatus


class WeekCreate(BaseModel):
    week_number: int
    start_date: date
    end_date: date
    sport_focus: list[int] = []

    @model_validator(mode="after")
    def check_dates(self) -> "WeekCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class WeekUpdate(BaseModel):
    week_number: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    sport_focus: Optional[list[int]] = None


class WeekResponse(BaseModel):
    id: int
    week_number: int
    start_date: date
    end_date: date
    status: WeekStatus
    sport_focus: list[Any]

    model_config = {"from_attributes": True}


class SchedulePreviewMatch(BaseModel):
    modality_id: int
    modality_name: str
    team_a: str
    team_b: str


class GenerateSchedulePreview(BaseModel):
    week_id: int
    matches: list[SchedulePreviewMatch]
