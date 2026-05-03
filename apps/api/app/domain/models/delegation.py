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


class DelegationStatus(str, Enum):
    INDEPENDENT = "INDEPENDENT"
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Delegation(SQLModel, table=True):
    __tablename__ = "delegations"

    id: Optional[int] = Field(default=None, primary_key=True)
    league_id: Optional[int] = Field(default=None, foreign_key="leagues.id")
    code: str = Field(unique=True)
    name: str
    flag_url: Optional[str] = None
    chief_id: Optional[int] = Field(default=None, foreign_key="users.id")
    is_active: bool = Field(default=True)
    status: DelegationStatus = Field(default=DelegationStatus.INDEPENDENT)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class DelegationMember(SQLModel, table=True):
    __tablename__ = "delegation_members"

    id: Optional[int] = Field(default=None, primary_key=True)
    delegation_id: int = Field(foreign_key="delegations.id")
    user_id: int = Field(foreign_key="users.id")
    role: DelegationMemberRole
    joined_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    left_at: Optional[datetime] = None


class DelegationInvite(SQLModel, table=True):
    __tablename__ = "delegation_invites"

    id: Optional[int] = Field(default=None, primary_key=True)
    delegation_id: int = Field(foreign_key="delegations.id")
    user_id: int = Field(foreign_key="users.id")
    status: InviteStatus = Field(default=InviteStatus.PENDING)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class LeagueParticipationRequest(SQLModel, table=True):
    __tablename__ = "league_participation_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    delegation_id: int = Field(foreign_key="delegations.id")
    league_id: int = Field(foreign_key="leagues.id")
    requested_by: int = Field(foreign_key="users.id")
    status: DelegationStatus = Field(default=DelegationStatus.PENDING)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")
