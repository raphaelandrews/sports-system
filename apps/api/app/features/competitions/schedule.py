import logging
from datetime import date, datetime, timedelta
from time import time as _time_fn

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.event import Event, EventPhase, EventStatus
from app.domain.models.sport import Modality
from app.domain.models.competition import Competition
from app.domain.models.league import League, LeagueMode

logger = logging.getLogger(__name__)

# Tue–Sun offsets from week Monday start
_DAY_OFFSETS = [1, 2, 3, 4, 5, 6]
_SLOTS = ["09:00", "11:00", "13:30", "16:00", "18:30", "20:30"]


def _slot_time(slot_str: str):
    from datetime import time

    h, m = slot_str.split(":")
    return time(int(h), int(m))


async def generate_events(
    session: AsyncSession,
    competition: Competition,
) -> list[Event]:
    """
    For each sport_id in competition.sport_focus, find active modalities and create
    one Event per modality, spread across Tue–Sun slots.
    Returns list of created Events.
    """
    sport_ids: list[int] = [int(s) for s in (competition.sport_focus or [])]
    if not sport_ids:
        return []

    modalities_result = await session.execute(
        select(Modality).where(
            Modality.sport_id.in_(sport_ids),
            Modality.is_active == True,  # noqa: E712
        )
    )
    modalities = list(modalities_result.scalars().all())

    # Check league mode
    league = await session.get(League, competition.league_id)
    is_speed = league is not None and league.mode == LeagueMode.SPEED

    if is_speed:
        # Speed mode: all events start at 10-second intervals from competition start
        return await _generate_speed_events(session, competition, modalities)

    # Normal mode: spread across Tue–Sun slots
    monday = competition.start_date
    monday = monday - timedelta(days=monday.weekday())

    valid_days: list[date] = []
    for day_offset in _DAY_OFFSETS:
        day = monday + timedelta(days=day_offset)
        if day <= competition.end_date:
            valid_days.append(day)

    slots: list[tuple[date, object]] = []
    for slot_str in _SLOTS:
        for day in valid_days:
            slots.append((day, _slot_time(slot_str)))

    created: list[Event] = []
    for idx, mod in enumerate(modalities):
        if idx >= len(slots):
            break
        event_date, start_time = slots[idx]
        bracket_format = mod.rules_json.get("bracket_format", "group-stage")
        if bracket_format in ("single-elimination", "double-elimination"):
            phase = EventPhase.QUARTER
        else:
            phase = EventPhase.GROUPS
        event = Event(
            competition_id=competition.id,
            modality_id=mod.id,
            event_date=event_date,
            start_time=start_time,
            phase=phase,
            status=EventStatus.SCHEDULED,
        )
        session.add(event)
        created.append(event)

    await session.flush()
    for event in created:
        await session.refresh(event)
    logger.info(
        "schedule_generated competition_id=%s events=%s", competition.id, len(created)
    )
    return created


async def _generate_speed_events(
    session: AsyncSession,
    competition: Competition,
    modalities: list[Modality],
) -> list[Event]:
    """Speed mode: schedule all events at 10-second intervals starting from competition start."""
    from datetime import time

    base_date = competition.start_date
    base_time = datetime.combine(base_date, time(0, 0, 0))
    interval_seconds = 10

    created: list[Event] = []
    for idx, mod in enumerate(modalities):
        event_dt = base_time + timedelta(seconds=idx * interval_seconds)
        bracket_format = mod.rules_json.get("bracket_format", "group-stage")
        if bracket_format in ("single-elimination", "double-elimination"):
            phase = EventPhase.QUARTER
        else:
            phase = EventPhase.GROUPS
        event = Event(
            competition_id=competition.id,
            modality_id=mod.id,
            event_date=event_dt.date(),
            start_time=event_dt.time(),
            phase=phase,
            status=EventStatus.SCHEDULED,
        )
        session.add(event)
        created.append(event)

    await session.flush()
    for event in created:
        await session.refresh(event)
    logger.info(
        "speed_schedule_generated competition_id=%s events=%s interval=%ss",
        competition.id,
        len(created),
        interval_seconds,
    )
    return created
