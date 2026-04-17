from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlmodel import Field, SQLModel


class DelegationMemberRole(str, Enum):
    CHIEF = "CHIEF"
    ATHLETE = "ATHLETE"
    COACH = "COACH"


class InviteStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REFUSED = "REFUSED"


class Delegation(SQLModel, table=True):
    __tablename__ = "delegations"

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True)
    name: str
    flag_url: Optional[str] = None
    chief_id: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DelegationMember(SQLModel, table=True):
    __tablename__ = "delegation_members"

    id: Optional[int] = Field(default=None, primary_key=True)
    delegation_id: int = Field(foreign_key="delegations.id")
    user_id: int = Field(foreign_key="users.id")
    role: DelegationMemberRole
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    left_at: Optional[datetime] = None


class DelegationInvite(SQLModel, table=True):
    __tablename__ = "delegation_invites"

    id: Optional[int] = Field(default=None, primary_key=True)
    delegation_id: int = Field(foreign_key="delegations.id")
    user_id: int = Field(foreign_key="users.id")
    status: InviteStatus = Field(default=InviteStatus.PENDING)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
