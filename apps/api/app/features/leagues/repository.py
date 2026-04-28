from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.league import League, LeagueMember, LeagueStatus


async def get_all(session: AsyncSession) -> list[League]:
    result = await session.execute(
        select(League)
        .where(League.status == LeagueStatus.ACTIVE)
        .order_by(League.name.asc())
    )
    return list(result.scalars().all())


async def get_active_leagues(session: AsyncSession) -> list[League]:
    return await get_all(session)


async def get_by_id(session: AsyncSession, league_id: int) -> League | None:
    result = await session.execute(select(League).where(League.id == league_id))
    return result.scalar_one_or_none()


async def get_by_slug(session: AsyncSession, slug: str) -> League | None:
    result = await session.execute(select(League).where(League.slug == slug))
    return result.scalar_one_or_none()


async def create(session: AsyncSession, league: League) -> League:
    session.add(league)
    await session.flush()
    return league


async def update(session: AsyncSession, league: League) -> League:
    session.add(league)
    await session.flush()
    return league


async def get_member(
    session: AsyncSession, league_id: int, user_id: int
) -> LeagueMember | None:
    result = await session.execute(
        select(LeagueMember).where(
            LeagueMember.league_id == league_id,
            LeagueMember.user_id == user_id,
            LeagueMember.left_at == None,  # noqa: E711
        )
    )
    return result.scalar_one_or_none()


async def get_members(session: AsyncSession, league_id: int) -> list[LeagueMember]:
    result = await session.execute(
        select(LeagueMember)
        .where(
            LeagueMember.league_id == league_id,
            LeagueMember.left_at == None,  # noqa: E711
        )
        .order_by(LeagueMember.joined_at.asc(), LeagueMember.id.asc())
    )
    return list(result.scalars().all())


async def add_member(session: AsyncSession, member: LeagueMember) -> LeagueMember:
    session.add(member)
    await session.flush()
    return member


async def update_member_role(
    session: AsyncSession, member: LeagueMember
) -> LeagueMember:
    session.add(member)
    await session.flush()
    return member


async def remove_member(session: AsyncSession, member: LeagueMember) -> LeagueMember:
    session.add(member)
    await session.flush()
    return member


async def get_leagues_for_user(session: AsyncSession, user_id: int) -> list[League]:
    result = await session.execute(
        select(League)
        .join(LeagueMember, LeagueMember.league_id == League.id)
        .where(
            LeagueMember.user_id == user_id,
            LeagueMember.left_at == None,  # noqa: E711
            League.status == LeagueStatus.ACTIVE,
        )
        .order_by(League.name.asc())
    )
    return list(result.scalars().all())


async def get_member_count(session: AsyncSession, league_id: int) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(LeagueMember)
        .where(
            LeagueMember.league_id == league_id,
            LeagueMember.left_at == None,  # noqa: E711
        )
    )
    return int(result.scalar_one())
