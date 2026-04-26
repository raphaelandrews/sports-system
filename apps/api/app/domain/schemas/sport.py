from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel

from app.domain.models.sport import Gender, SportType


class ModalityResponse(BaseModel):
    id: int
    sport_id: int
    name: str
    gender: Gender
    category: Optional[str]
    rules_json: dict[str, Any]
    is_active: bool

    model_config = {"from_attributes": True}


class SportResponse(BaseModel):
    id: int
    name: str
    sport_type: SportType
    description: Optional[str]
    rules_json: dict[str, Any]
    player_count: Optional[int]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SportDetailResponse(SportResponse):
    modalities: list[ModalityResponse]
    stats_schema: Optional[dict[str, Any]] = None


class SportCreate(BaseModel):
    name: str
    sport_type: SportType
    description: Optional[str] = None
    rules_json: dict[str, Any] = {}
    player_count: Optional[int] = None


class SportUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    rules_json: Optional[dict[str, Any]] = None
    player_count: Optional[int] = None

    def has_updates(self) -> bool:
        return any(v is not None for v in self.model_dump().values())


class ModalityCreate(BaseModel):
    name: str
    gender: Gender
    category: Optional[str] = None
    rules_json: dict[str, Any] = {}


class ModalityUpdate(BaseModel):
    name: Optional[str] = None
    gender: Optional[Gender] = None
    category: Optional[str] = None
    rules_json: Optional[dict[str, Any]] = None

    def has_updates(self) -> bool:
        return any(v is not None for v in self.model_dump().values())
