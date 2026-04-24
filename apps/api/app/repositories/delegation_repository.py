from sqlalchemy import case, distinct, func, or_, select, union
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.athlete import Athlete
from app.models.delegation import Delegation, DelegationInvite, DelegationMember, InviteStatus
from app.models.event import Event, Match, MatchParticipant, MatchStatus
from app.models.result import Medal, Result
from app.models.competition import Competition
from app.models.user import User


async def get_by_id(session: AsyncSession, delegation_id: int) -> Delegation | None:
    return await session.get(Delegation, delegation_id)


async def get_by_id_in_league(
    session: AsyncSession, league_id: int, delegation_id: int
) -> Delegation | None:
    result = await session.execute(
        select(Delegation).where(
            Delegation.id == delegation_id,
            Delegation.league_id == league_id,
        )
    )
    return result.scalar_one_or_none()


async def get_by_code(session: AsyncSession, league_id: int, code: str) -> Delegation | None:
    result = await session.execute(
        select(Delegation).where(
            Delegation.league_id == league_id,
            Delegation.code == code,
        )
    )
    return result.scalar_one_or_none()


async def search(
    session: AsyncSession,
    league_id: int,
    query: str,
    limit: int = 8,
) -> list[Delegation]:
    pattern = f"%{query.strip()}%"
    result = await session.execute(
        select(Delegation)
        .where(
            Delegation.league_id == league_id,
            or_(
                Delegation.name.ilike(pattern),
                Delegation.code.ilike(pattern),
            )
        )
        .order_by(Delegation.name.asc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def list_active(
    session: AsyncSession, league_id: int, page: int = 1, per_page: int = 20
) -> tuple[list[Delegation], int]:
    offset = (page - 1) * per_page
    count_result = await session.execute(
        select(func.count()).select_from(Delegation).where(
            Delegation.league_id == league_id,
            Delegation.is_active == True,  # noqa: E712
        )
    )
    total = count_result.scalar_one()
    result = await session.execute(
        select(Delegation)
        .where(Delegation.is_active == True)  # noqa: E712
        .where(Delegation.league_id == league_id)
        .order_by(Delegation.name)
        .offset(offset)
        .limit(per_page)
    )
    return result.scalars().all(), total  # type: ignore[return-value]


async def create(session: AsyncSession, delegation: Delegation) -> Delegation:
    session.add(delegation)
    await session.flush()
    return delegation


async def save(session: AsyncSession, delegation: Delegation) -> Delegation:
    session.add(delegation)
    await session.flush()
    return delegation


async def get_active_members_with_users(
    session: AsyncSession, delegation_id: int
) -> list[tuple[DelegationMember, User]]:
    result = await session.execute(
        select(DelegationMember, User)
        .join(User, DelegationMember.user_id == User.id)
        .where(
            DelegationMember.delegation_id == delegation_id,
            DelegationMember.left_at == None,  # noqa: E711
        )
        .order_by(DelegationMember.joined_at)
    )
    return result.all()  # type: ignore[return-value]


async def get_member_history_with_users(
    session: AsyncSession, delegation_id: int
) -> list[tuple[DelegationMember, User]]:
    result = await session.execute(
        select(DelegationMember, User)
        .join(User, DelegationMember.user_id == User.id)
        .where(DelegationMember.delegation_id == delegation_id)
        .order_by(DelegationMember.joined_at.desc())
    )
    return result.all()  # type: ignore[return-value]


async def get_active_membership(
    session: AsyncSession, user_id: int, league_id: int
) -> DelegationMember | None:
    result = await session.execute(
        select(DelegationMember)
        .join(Delegation, Delegation.id == DelegationMember.delegation_id)
        .where(
            DelegationMember.user_id == user_id,
            DelegationMember.left_at == None,  # noqa: E711
            Delegation.league_id == league_id,
        )
    )
    return result.scalar_one_or_none()


async def create_member(session: AsyncSession, member: DelegationMember) -> DelegationMember:
    session.add(member)
    await session.flush()
    return member


async def save_member(session: AsyncSession, member: DelegationMember) -> DelegationMember:
    session.add(member)
    await session.flush()
    return member


async def get_pending_invites(
    session: AsyncSession, delegation_id: int
) -> list[DelegationInvite]:
    result = await session.execute(
        select(DelegationInvite).where(
            DelegationInvite.delegation_id == delegation_id,
            DelegationInvite.status == InviteStatus.PENDING,
        )
    )
    return result.scalars().all()  # type: ignore[return-value]


async def get_invite_by_id(session: AsyncSession, invite_id: int) -> DelegationInvite | None:
    return await session.get(DelegationInvite, invite_id)


async def create_invite(session: AsyncSession, invite: DelegationInvite) -> DelegationInvite:
    session.add(invite)
    await session.flush()
    return invite


async def save_invite(session: AsyncSession, invite: DelegationInvite) -> DelegationInvite:
    session.add(invite)
    await session.flush()
    return invite


async def get_current_delegation_id(
    session: AsyncSession, user_id: int, league_id: int | None = None
) -> int | None:
    query = select(DelegationMember.delegation_id).join(
        Delegation, Delegation.id == DelegationMember.delegation_id
    ).where(
        DelegationMember.user_id == user_id,
        DelegationMember.left_at == None,  # noqa: E711
    )
    if league_id is not None:
        query = query.where(Delegation.league_id == league_id)
    result = await session.execute(
        query
    )
    return result.scalar_one_or_none()


async def get_athlete_statistics(session: AsyncSession, delegation_id: int) -> list[dict]:
    membership_athletes = (
        select(Athlete.id.label("athlete_id"))
        .join(DelegationMember, DelegationMember.user_id == Athlete.user_id)
        .where(DelegationMember.delegation_id == delegation_id)
    )
    result_athletes = select(Result.athlete_id.label("athlete_id")).where(
        Result.delegation_id == delegation_id,
        Result.athlete_id.is_not(None),
    )
    participant_athletes = select(MatchParticipant.athlete_id.label("athlete_id")).where(
        MatchParticipant.delegation_id_at_time == delegation_id
    )

    athlete_ids = union(membership_athletes, result_athletes, participant_athletes).subquery()

    membership_stats = (
        select(
            Athlete.id.label("athlete_id"),
            func.min(DelegationMember.joined_at).label("joined_at"),
            func.max(DelegationMember.left_at).label("left_at"),
            func.max(
                case(
                    (DelegationMember.left_at.is_(None), 1),
                    else_=0,
                )
            ).label("is_current_member"),
        )
        .join(DelegationMember, DelegationMember.user_id == Athlete.user_id)
        .where(DelegationMember.delegation_id == delegation_id)
        .group_by(Athlete.id)
        .subquery()
    )

    match_stats = (
        select(
            MatchParticipant.athlete_id.label("athlete_id"),
            func.count(distinct(MatchParticipant.match_id)).label("total_matches"),
        )
        .where(MatchParticipant.delegation_id_at_time == delegation_id)
        .group_by(MatchParticipant.athlete_id)
        .subquery()
    )

    medal_stats = (
        select(
            Result.athlete_id.label("athlete_id"),
            func.count().filter(Result.medal == Medal.GOLD).label("gold"),
            func.count().filter(Result.medal == Medal.SILVER).label("silver"),
            func.count().filter(Result.medal == Medal.BRONZE).label("bronze"),
        )
        .where(
            Result.delegation_id == delegation_id,
            Result.athlete_id.is_not(None),
            Result.medal.is_not(None),
        )
        .group_by(Result.athlete_id)
        .subquery()
    )

    result = await session.execute(
        select(
            Athlete.id,
            Athlete.name,
            Athlete.code,
            Athlete.is_active,
            membership_stats.c.joined_at,
            membership_stats.c.left_at,
            func.coalesce(membership_stats.c.is_current_member, 0).label("is_current_member"),
            func.coalesce(match_stats.c.total_matches, 0).label("total_matches"),
            func.coalesce(medal_stats.c.gold, 0).label("gold"),
            func.coalesce(medal_stats.c.silver, 0).label("silver"),
            func.coalesce(medal_stats.c.bronze, 0).label("bronze"),
        )
        .join(athlete_ids, athlete_ids.c.athlete_id == Athlete.id)
        .outerjoin(membership_stats, membership_stats.c.athlete_id == Athlete.id)
        .outerjoin(match_stats, match_stats.c.athlete_id == Athlete.id)
        .outerjoin(medal_stats, medal_stats.c.athlete_id == Athlete.id)
        .order_by(
            (func.coalesce(medal_stats.c.gold, 0) + func.coalesce(medal_stats.c.silver, 0) + func.coalesce(medal_stats.c.bronze, 0)).desc(),
            func.coalesce(match_stats.c.total_matches, 0).desc(),
            Athlete.name.asc(),
        )
    )

    return [
        {
            "athlete_id": row.id,
            "athlete_name": row.name,
            "athlete_code": row.code,
            "is_active": row.is_active,
            "joined_at": row.joined_at,
            "left_at": row.left_at,
            "is_current_member": bool(row.is_current_member),
            "total_matches": row.total_matches,
            "gold": row.gold,
            "silver": row.silver,
            "bronze": row.bronze,
        }
        for row in result.all()
    ]


async def get_medal_entries(session: AsyncSession, delegation_id: int) -> list[dict]:
    result = await session.execute(
        select(
            Result.id.label("result_id"),
            Result.athlete_id,
            Athlete.name.label("athlete_name"),
            Result.match_id,
            Result.rank,
            Result.medal,
        )
        .outerjoin(Athlete, Athlete.id == Result.athlete_id)
        .where(
            Result.delegation_id == delegation_id,
            Result.medal.is_not(None),
        )
        .order_by(Result.id.desc())
    )
    return [
        {
            "result_id": row.result_id,
            "athlete_id": row.athlete_id,
            "athlete_name": row.athlete_name,
            "match_id": row.match_id,
            "rank": row.rank,
            "medal": row.medal,
        }
        for row in result.all()
    ]


async def get_weekly_performance(session: AsyncSession, delegation_id: int) -> list[dict]:
    team_matches = (
        select(Match.id.label("match_id"), Event.competition_id.label("competition_id"))
        .join(Event, Event.id == Match.event_id)
        .where(
            (Match.team_a_delegation_id == delegation_id)
            | (Match.team_b_delegation_id == delegation_id)
        )
    )
    participant_matches = (
        select(MatchParticipant.match_id.label("match_id"), Event.competition_id.label("competition_id"))
        .join(Match, Match.id == MatchParticipant.match_id)
        .join(Event, Event.id == Match.event_id)
        .where(MatchParticipant.delegation_id_at_time == delegation_id)
    )
    involved_matches = union(team_matches, participant_matches).subquery()

    match_totals = (
        select(
            involved_matches.c.competition_id,
            func.count(distinct(involved_matches.c.match_id)).label("matches_played"),
            func.count(distinct(Match.id))
            .filter(Match.status == MatchStatus.COMPLETED)
            .label("matches_completed"),
        )
        .join(Match, Match.id == involved_matches.c.match_id)
        .group_by(involved_matches.c.competition_id)
        .subquery()
    )

    win_totals = (
        select(
            Event.competition_id.label("competition_id"),
            func.count(distinct(Result.match_id)).label("wins"),
        )
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .where(
            Result.delegation_id == delegation_id,
            Result.rank == 1,
        )
        .group_by(Event.competition_id)
        .subquery()
    )

    medal_totals = (
        select(
            Event.competition_id.label("competition_id"),
            func.count().filter(Result.medal == Medal.GOLD).label("gold"),
            func.count().filter(Result.medal == Medal.SILVER).label("silver"),
            func.count().filter(Result.medal == Medal.BRONZE).label("bronze"),
        )
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .where(
            Result.delegation_id == delegation_id,
            Result.medal.is_not(None),
        )
        .group_by(Event.competition_id)
        .subquery()
    )

    result = await session.execute(
        select(
            Competition.id,
            Competition.number,
            Competition.status,
            Competition.start_date,
            Competition.end_date,
            func.coalesce(match_totals.c.matches_played, 0).label("matches_played"),
            func.coalesce(match_totals.c.matches_completed, 0).label("matches_completed"),
            func.coalesce(win_totals.c.wins, 0).label("wins"),
            func.coalesce(medal_totals.c.gold, 0).label("gold"),
            func.coalesce(medal_totals.c.silver, 0).label("silver"),
            func.coalesce(medal_totals.c.bronze, 0).label("bronze"),
        )
        .outerjoin(match_totals, match_totals.c.competition_id == Competition.id)
        .outerjoin(win_totals, win_totals.c.competition_id == Competition.id)
        .outerjoin(medal_totals, medal_totals.c.competition_id == Competition.id)
        .where(
            or_(
                match_totals.c.competition_id.is_not(None),
                win_totals.c.competition_id.is_not(None),
                medal_totals.c.competition_id.is_not(None),
            )
        )
        .order_by(Competition.number)
    )

    return [
        {
            "competition_id": row.id,
            "number": row.number,
            "status": row.status.value,
            "start_date": row.start_date,
            "end_date": row.end_date,
            "matches_played": row.matches_played,
            "matches_completed": row.matches_completed,
            "wins": row.wins,
            "gold": row.gold,
            "silver": row.silver,
            "bronze": row.bronze,
        }
        for row in result.all()
    ]
