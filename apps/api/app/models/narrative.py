from datetime import date, datetime, timezone
from typing import Optional

from sqlalchemy import Column, Date, Text
from sqlmodel import Field, SQLModel


class Narrative(SQLModel, table=True):
    __tablename__ = "narratives"

    id: Optional[int] = Field(default=None, primary_key=True)
    narrative_date: date = Field(sa_column=Column("narrative_date", Date, nullable=False, unique=True))
    content: str = Field(sa_column=Column(Text, nullable=False))
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )


class AIGeneration(SQLModel, table=True):
    __tablename__ = "ai_generations"

    id: Optional[int] = Field(default=None, primary_key=True)
    generation_type: str
    count: int = Field(default=0)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
