from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.delegation import DelegationMemberRole, InviteStatus


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
    code: str
    name: str
    flag_url: Optional[str]
    chief_id: Optional[int]
    is_active: bool
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
