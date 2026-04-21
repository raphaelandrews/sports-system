import logging
from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.config import settings
from app.database import async_session_factory
from app.models.event import Event, Match, MatchStatus
from app.models.week import CompetitionWeek, WeekStatus

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def _auto_lock_weeks() -> None:
    now_utc = datetime.now(UTC).replace(tzinfo=None)
    async with async_session_factory() as session:
        result = await session.execute(
            select(CompetitionWeek).where(CompetitionWeek.status == WeekStatus.SCHEDULED)
        )
        weeks = result.scalars().all()
        for week in weeks:
            first_event_result = await session.execute(
                select(Event)
                .where(Event.week_id == week.id)
                .order_by(Event.event_date, Event.start_time)
                .limit(1)
            )
            event = first_event_result.scalar_one_or_none()
            if event is None:
                continue
            event_dt = datetime.combine(event.event_date, event.start_time)
            if event_dt < now_utc:
                week.status = WeekStatus.LOCKED
                session.add(week)
                from app.services import bracket_service
                matches = await bracket_service.generate(session, week.id)
                logger.info("auto_lock_week week_id=%s bracket_matches=%s", week.id, matches)
        await session.commit()


async def _auto_start_matches() -> None:
    if not settings.AUTO_SIMULATE:
        return
    now_utc = datetime.now(UTC).replace(tzinfo=None)
    async with async_session_factory() as session:
        result = await session.execute(
            select(Match, Event)
            .join(Event, Match.event_id == Event.id)
            .where(Match.status == MatchStatus.SCHEDULED)
        )
        rows = result.all()
        for match, event in rows:
            event_dt = datetime.combine(event.event_date, event.start_time)
            if event_dt <= now_utc:
                match.status = MatchStatus.IN_PROGRESS
                match.started_at = now_utc  # already naive via .replace(tzinfo=None)
                session.add(match)
                logger.info("auto_start_match match_id=%s", match.id)
                # simulation_service.start(match, session) — Phase 9
        await session.commit()


async def _auto_finish_matches() -> None:
    if not settings.AUTO_SIMULATE:
        return
    cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=5)
    async with async_session_factory() as session:
        result = await session.execute(
            select(Match).where(
                Match.status == MatchStatus.IN_PROGRESS,
                Match.started_at <= cutoff,
            )
        )
        matches = result.scalars().all()
        for match in matches:
            try:
                from app.services import simulation_service
                await simulation_service.simulate_match(session, match.id)
                logger.info("auto_finish_match match_id=%s", match.id)
            except Exception as exc:
                logger.error("auto_finish_error match_id=%s error=%s", match.id, exc)
        await session.commit()


async def _send_match_reminders() -> None:
    tz = ZoneInfo(settings.TIMEZONE)
    tomorrow_start = datetime.now(tz).replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    tomorrow_end = tomorrow_start + timedelta(days=1)
    t_start = tomorrow_start.astimezone(UTC).time()
    t_end = tomorrow_end.astimezone(UTC).time()
    async with async_session_factory() as session:
        result = await session.execute(
            select(Event).where(
                Event.event_date == tomorrow_start.date(),
                Event.start_time >= t_start,
                Event.start_time < t_end,
            )
        )
        events = result.scalars().all()
        for event in events:
            logger.info("match_reminder_pending event_id=%s", event.id)
            # notification_service.send_match_reminders(event, session) — Phase 2


def setup_scheduler() -> AsyncIOScheduler:
    scheduler.add_job(_auto_lock_weeks, "interval", minutes=5, id="auto_lock_weeks")
    scheduler.add_job(_auto_start_matches, "interval", minutes=1, id="auto_start_matches")
    scheduler.add_job(_auto_finish_matches, "interval", minutes=1, id="auto_finish_matches")
    # midnight UTC-3 = 03:00 UTC
    scheduler.add_job(_send_match_reminders, "cron", hour=3, minute=0, id="match_reminders")
    return scheduler
