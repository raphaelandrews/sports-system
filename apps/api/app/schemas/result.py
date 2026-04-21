from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel

from app.models.result import Medal


class ResultCreate(BaseModel):
    match_id: int
    delegation_id: Optional[int] = None
    athlete_id: Optional[int] = None
    rank: int
    medal: Optional[Medal] = None
    value_json: Optional[dict[str, Any]] = None


class ResultUpdate(BaseModel):
    rank: Optional[int] = None
    medal: Optional[Medal] = None
    value_json: Optional[dict[str, Any]] = None


class ResultResponse(BaseModel):
    id: int
    match_id: int
    delegation_id: Optional[int]
    athlete_id: Optional[int]
    rank: int
    medal: Optional[Medal]
    value_json: Optional[dict[str, Any]]

    model_config = {"from_attributes": True}


class MedalBoardEntry(BaseModel):
    delegation_id: int
    delegation_name: str
    delegation_code: str
    gold: int
    silver: int
    bronze: int
    total: int


class SportStandingEntry(BaseModel):
    rank: int
    delegation_id: Optional[int] = None
    delegation_name: Optional[str] = None
    athlete_id: Optional[int] = None
    athlete_name: Optional[str] = None
    medal: Optional[Medal] = None
    value_json: Optional[dict[str, Any]] = None


class RecordResponse(BaseModel):
    id: int
    modality_id: int
    modality_name: str
    athlete_id: int
    athlete_name: str
    delegation_name: str
    value: str
    week_id: int
    set_at: datetime
