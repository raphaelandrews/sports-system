import logging
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.config import settings
from app.database import async_session_factory
from app.models.competition import Competition, CompetitionStatus
from app.models.event import Event, Match, MatchStatus

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="UTC")


async def _auto_lock_competitions() -> None:
    now_utc = datetime.now(UTC).replace(tzinfo=None)
    async with async_session_factory() as session:
        result = await session.execute(
            select(Competition).where(Competition.status == CompetitionStatus.SCHEDULED)
        )
        competitions = result.scalars().all()
        for competition in competitions:
            first_event_result = await session.execute(
                select(Event)
                .where(Event.competition_id == competition.id)
                .order_by(Event.event_date, Event.start_time)
                .limit(1)
            )
            event = first_event_result.scalar_one_or_none()
            if event is None:
                continue
            event_dt = datetime.combine(event.event_date, event.start_time)
            if event_dt < now_utc:
                competition.status = CompetitionStatus.LOCKED
                session.add(competition)
                from app.services import bracket_service
                matches = await bracket_service.generate(session, competition.id)
                logger.info(
                    "auto_lock_competition competition_id=%s bracket_matches=%s",
                    competition.id, matches,
                )
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
                match.started_at = now_utc
                session.add(match)
                logger.info("auto_start_match match_id=%s", match.id)
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


def setup_scheduler() -> AsyncIOScheduler:
    scheduler.add_job(_auto_lock_competitions, "interval", minutes=5, id="auto_lock_competitions")
    scheduler.add_job(_auto_start_matches, "interval", minutes=1, id="auto_start_matches")
    scheduler.add_job(_auto_finish_matches, "interval", minutes=1, id="auto_finish_matches")
    # midnight UTC-3 = 03:00 UTC
    scheduler.add_job(_send_match_reminders, "cron", hour=3, minute=0, id="match_reminders")
    return scheduler
