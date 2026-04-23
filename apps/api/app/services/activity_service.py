from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories import activity_repository
from app.schemas.activity import ActivityFeedItem, ActivityFeedItemType


def _build_match_event_title(event_type: str, sport_name: str | None) -> str:
    label = event_type.replace("_", " ").title()
    return f"{label} em {sport_name}" if sport_name else label


def _build_match_event_description(item: dict) -> str:
    parts: list[str] = []
    if item.get("delegation_name"):
        parts.append(str(item["delegation_name"]))
    if item.get("athlete_name"):
        parts.append(str(item["athlete_name"]))
    if item.get("minute") is not None:
        parts.append(f'{item["minute"]}min')
    if item.get("modality_name"):
        parts.append(str(item["modality_name"]))
    return " · ".join(parts) or "Atualização de partida"


def _map_match_event(item: dict) -> ActivityFeedItem:
    event_type = item["event_type"].value if hasattr(item["event_type"], "value") else str(item["event_type"])
    return ActivityFeedItem(
        id=f'match-event-{item["activity_id"]}',
        item_type=ActivityFeedItemType.MATCH_EVENT,
        created_at=item["created_at"],
        title=_build_match_event_title(event_type, item.get("sport_name")),
        description=_build_match_event_description(item),
        match_id=item.get("match_id"),
        event_id=item.get("event_id"),
        week_id=item.get("week_id"),
        week_number=item.get("week_number"),
        sport_id=item.get("sport_id"),
        sport_name=item.get("sport_name"),
        modality_id=item.get("modality_id"),
        modality_name=item.get("modality_name"),
        event_date=item.get("event_date"),
        start_time=item.get("start_time"),
        athlete_id=item.get("athlete_id"),
        athlete_name=item.get("athlete_name"),
        delegation_id=item.get("delegation_id"),
        delegation_name=item.get("delegation_name"),
        minute=item.get("minute"),
    )


def _map_match_state_change(item: dict) -> ActivityFeedItem:
    item_type = ActivityFeedItemType(item["item_type"])
    title = "Partida iniciada" if item_type == ActivityFeedItemType.MATCH_STARTED else "Partida encerrada"
    description = item.get("modality_name") or item.get("sport_name") or "Partida"
    return ActivityFeedItem(
        id=f'{item_type.value.lower()}-{item["match_id"]}-{item["created_at"].isoformat()}',
        item_type=item_type,
        created_at=item["created_at"],
        title=title,
        description=description,
        match_id=item.get("match_id"),
        event_id=item.get("event_id"),
        week_id=item.get("week_id"),
        week_number=item.get("week_number"),
        sport_id=item.get("sport_id"),
        sport_name=item.get("sport_name"),
        modality_id=item.get("modality_id"),
        modality_name=item.get("modality_name"),
        event_date=item.get("event_date"),
        start_time=item.get("start_time"),
    )


def _map_record(item: dict) -> ActivityFeedItem:
    description_parts = [item.get("athlete_name"), item.get("delegation_name"), item.get("value")]
    return ActivityFeedItem(
        id=f'record-{item["activity_id"]}',
        item_type=ActivityFeedItemType.RECORD_SET,
        created_at=item["created_at"],
        title=f'Recorde em {item.get("modality_name") or item.get("sport_name") or "modalidade"}',
        description=" · ".join(str(part) for part in description_parts if part),
        week_id=item.get("week_id"),
        week_number=item.get("week_number"),
        sport_id=item.get("sport_id"),
        sport_name=item.get("sport_name"),
        modality_id=item.get("modality_id"),
        modality_name=item.get("modality_name"),
        athlete_id=item.get("athlete_id"),
        athlete_name=item.get("athlete_name"),
        delegation_id=item.get("delegation_id"),
        delegation_name=item.get("delegation_name"),
    )


async def list_feed(session: AsyncSession, limit: int) -> list[ActivityFeedItem]:
    fetch_limit = max(limit * 3, 30)
    match_events = await activity_repository.list_recent_match_events(session, fetch_limit)
    state_changes = await activity_repository.list_recent_match_state_changes(session, fetch_limit)
    records = await activity_repository.list_recent_records(session, fetch_limit)

    items = [
        *(_map_match_event(item) for item in match_events),
        *(_map_match_state_change(item) for item in state_changes if item.get("created_at") is not None),
        *(_map_record(item) for item in records),
    ]
    items.sort(key=lambda item: item.created_at, reverse=True)
    return items[:limit]
