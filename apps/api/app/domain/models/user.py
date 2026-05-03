from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from sqlalchemy import JSON, Column
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SUPERADMIN = "SUPERADMIN"
    USER = "USER"
    CHIEF = "CHIEF"
    COACH = "COACH"
    ATHLETE = "ATHLETE"


class NotificationType(str, Enum):
    INVITE = "INVITE"
    REQUEST_REVIEWED = "REQUEST_REVIEWED"
    MATCH_REMINDER = "MATCH_REMINDER"
    RESULT = "RESULT"
    TRANSFER = "TRANSFER"
    PARTICIPATION_REQUEST = "PARTICIPATION_REQUEST"


class ChiefRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True)
    name: str
    hashed_password: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    is_verified: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_tokens"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    token_hash: str = Field(unique=True)
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class ChiefRequest(SQLModel, table=True):
    __tablename__ = "chief_requests"

    id: Optional[int] = Field(default=None, primary_key=True)
    league_id: int = Field(foreign_key="leagues.id")
    user_id: int = Field(foreign_key="users.id")
    delegation_name: str
    message: Optional[str] = None
    status: ChiefRequestStatus = Field(default=ChiefRequestStatus.PENDING)
    reviewed_by: Optional[int] = Field(default=None, foreign_key="users.id")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    # Column named "type" in DB; use notification_type as Python attr to avoid SA reserved word
    notification_type: NotificationType = Field(
        sa_column=Column(
            "type", SAEnum(NotificationType, name="notificationtype"), nullable=False
        )
    )
    payload: dict[str, Any] = Field(
        default_factory=dict, sa_column=Column(JSON, nullable=False)
    )
    read: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
