from datetime import date, datetime, time
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class ActivityFeedItemType(str, Enum):
    MATCH_STARTED = "MATCH_STARTED"
    MATCH_EVENT = "MATCH_EVENT"
    MATCH_FINISHED = "MATCH_FINISHED"
    RECORD_SET = "RECORD_SET"


class ActivityFeedItem(BaseModel):
    id: str
    item_type: ActivityFeedItemType
    created_at: datetime
    title: str
    description: str
    match_id: Optional[int] = None
    event_id: Optional[int] = None
    week_id: Optional[int] = None
    week_number: Optional[int] = None
    sport_id: Optional[int] = None
    sport_name: Optional[str] = None
    modality_id: Optional[int] = None
    modality_name: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    athlete_id: Optional[int] = None
    athlete_name: Optional[str] = None
    delegation_id: Optional[int] = None
    delegation_name: Optional[str] = None
    minute: Optional[int] = None
