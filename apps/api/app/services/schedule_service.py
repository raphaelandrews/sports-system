import logging
from datetime import date, timedelta
from time import time as _time_fn

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.event import Event, EventPhase, EventStatus
from app.models.sport import Modality
from app.models.week import CompetitionWeek

logger = logging.getLogger(__name__)

# Tue–Sun offsets from week Monday start
_DAY_OFFSETS = [1, 2, 3, 4, 5, 6]
_SLOTS = ["10:00", "14:00", "18:00"]


def _slot_time(slot_str: str):
    from datetime import time
    h, m = slot_str.split(":")
    return time(int(h), int(m))


async def generate_events(
    session: AsyncSession,
    week: CompetitionWeek,
) -> list[Event]:
    """
    For each sport_id in week.sport_focus, find active modalities and create
    one Event per modality, spread across Tue–Sun slots.
    Returns list of created Events.
    """
    sport_ids: list[int] = [int(s) for s in (week.sport_focus or [])]
    if not sport_ids:
        return []

    modalities_result = await session.execute(
        select(Modality).where(
            Modality.sport_id.in_(sport_ids),
            Modality.is_active == True,  # noqa: E712
        )
    )
    modalities = list(modalities_result.scalars().all())

    monday = week.start_date
    # Align to Monday
    monday = monday - timedelta(days=monday.weekday())

    slots: list[tuple[date, object]] = []
    for day_offset in _DAY_OFFSETS:
        day = monday + timedelta(days=day_offset)
        if day > week.end_date:
            break
        for slot_str in _SLOTS:
            slots.append((day, _slot_time(slot_str)))

    created: list[Event] = []
    for idx, mod in enumerate(modalities):
        if idx >= len(slots):
            break
        event_date, start_time = slots[idx]
        event = Event(
            week_id=week.id,
            modality_id=mod.id,
            event_date=event_date,
            start_time=start_time,
            phase=EventPhase.GROUPS,
            status=EventStatus.SCHEDULED,
        )
        session.add(event)
        created.append(event)

    await session.flush()
    for event in created:
        await session.refresh(event)
    logger.info("schedule_generated week_id=%s events=%s", week.id, len(created))
    return created
