from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.domain.models.league import LeagueMemberRole, LeagueStatus


class LeagueCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    sports_config: list[int] = Field(default_factory=list)
    transfer_window_enabled: bool = False
    timezone: str = "America/Sao_Paulo"


class LeagueUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    sports_config: Optional[list[int]] = None
    transfer_window_enabled: Optional[bool] = None
    timezone: Optional[str] = None
    status: Optional[LeagueStatus] = None


class LeagueResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    logo_url: Optional[str] = None
    created_by_id: int
    sports_config: list[int]
    transfer_window_enabled: bool
    timezone: str
    status: LeagueStatus
    created_at: datetime
    member_count: int = 0

    model_config = {"from_attributes": True}


class LeagueMemberResponse(BaseModel):
    id: int
    league_id: int
    user_id: int
    role: LeagueMemberRole
    joined_at: datetime
    left_at: Optional[datetime]

    model_config = {"from_attributes": True}


class LeagueMemberRoleUpdate(BaseModel):
    role: LeagueMemberRole
