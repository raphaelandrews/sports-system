from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class LeagueDelegation(SQLModel, table=True):
    __tablename__ = "league_delegations"

    id: Optional[int] = Field(default=None, primary_key=True)
    league_id: int = Field(foreign_key="leagues.id")
    delegation_id: int = Field(foreign_key="delegations.id")
    status: str = Field(default="APPROVED")
    joined_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
