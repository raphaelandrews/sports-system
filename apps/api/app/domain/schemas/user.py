from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel

from app.domain.models.user import ChiefRequestStatus, UserRole


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserSearchResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None

    def has_updates(self) -> bool:
        return self.name is not None or self.avatar_url is not None


class ChiefRequestCreate(BaseModel):
    delegation_name: str
    message: Optional[str] = None


class ChiefRequestResponse(BaseModel):
    id: int
    user_id: int
    delegation_name: str
    message: Optional[str]
    status: ChiefRequestStatus
    reviewed_by: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class ChiefRequestReview(BaseModel):
    status: Literal[ChiefRequestStatus.APPROVED, ChiefRequestStatus.REJECTED]
