from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.league import League, LeagueMember, LeagueMemberRole, LeagueStatus
from app.models.user import User, UserRole
from app.repositories import league_repository, user_repository
from app.schemas.league import LeagueCreate, LeagueMemberRoleUpdate, LeagueUpdate


def _is_superadmin(user: User) -> bool:
    return user.role in {UserRole.SUPERADMIN, UserRole.ADMIN}


async def create_league(session: AsyncSession, data: LeagueCreate, creator: User) -> League:
    existing = await league_repository.get_by_slug(session, data.slug)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="League slug already exists")

    league = League(
        name=data.name,
        slug=data.slug,
        description=data.description,
        created_by_id=creator.id,
        sports_config=data.sports_config,
        auto_simulate=data.auto_simulate,
        transfer_window_enabled=data.transfer_window_enabled,
        timezone=data.timezone,
    )
    league = await league_repository.create(session, league)
    await league_repository.add_member(
        session,
        LeagueMember(
            league_id=league.id,
            user_id=creator.id,
            role=LeagueMemberRole.LEAGUE_ADMIN,
        ),
    )
    return league


async def update_league(
    session: AsyncSession,
    league_id: int,
    data: LeagueUpdate,
    current_user: User,
) -> League:
    league = await get_league_or_404(session, league_id)
    await require_league_admin(session, league.id, current_user)

    if data.slug is not None and data.slug != league.slug:
        existing = await league_repository.get_by_slug(session, data.slug)
        if existing is not None and existing.id != league.id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="League slug already exists")

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(league, field, value)

    return await league_repository.update(session, league)


async def archive_league(session: AsyncSession, league_id: int, current_user: User) -> League:
    league = await get_league_or_404(session, league_id)
    if not _is_superadmin(current_user):
        await require_league_admin(session, league.id, current_user)
    league.status = LeagueStatus.ARCHIVED
    return await league_repository.update(session, league)


async def get_league_or_404(session: AsyncSession, league_id: int) -> League:
    league = await league_repository.get_by_id(session, league_id)
    if league is None or league.status != LeagueStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="League not found")
    return league


async def get_member_or_403(session: AsyncSession, league_id: int, user: User) -> LeagueMember:
    if _is_superadmin(user):
        league = await get_league_or_404(session, league_id)
        return LeagueMember(
            id=0,
            league_id=league.id,
            user_id=user.id,
            role=LeagueMemberRole.LEAGUE_ADMIN,
        )

    member = await league_repository.get_member(session, league_id, user.id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="League membership required")
    return member


async def require_league_admin(session: AsyncSession, league_id: int, user: User) -> LeagueMember:
    member = await get_member_or_403(session, league_id, user)
    if member.role != LeagueMemberRole.LEAGUE_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="League admin role required")
    return member


async def add_member(
    session: AsyncSession,
    league_id: int,
    user_id: int,
    role: LeagueMemberRole,
    current_user: User,
) -> LeagueMember:
    league = await get_league_or_404(session, league_id)
    await require_league_admin(session, league.id, current_user)

    target_user = await user_repository.get_by_id(session, user_id)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = await league_repository.get_member(session, league.id, user_id)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already a league member")

    return await league_repository.add_member(
        session,
        LeagueMember(
            league_id=league.id,
            user_id=user_id,
            role=role,
        ),
    )


async def update_member_role(
    session: AsyncSession,
    league_id: int,
    user_id: int,
    data: LeagueMemberRoleUpdate,
    current_user: User,
) -> LeagueMember:
    league = await get_league_or_404(session, league_id)
    await require_league_admin(session, league.id, current_user)

    member = await league_repository.get_member(session, league.id, user_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="League member not found")

    member.role = data.role
    return await league_repository.update_member_role(session, member)


async def remove_member(
    session: AsyncSession,
    league_id: int,
    user_id: int,
    current_user: User,
) -> LeagueMember:
    league = await get_league_or_404(session, league_id)
    is_self = current_user.id == user_id
    if not is_self and not _is_superadmin(current_user):
        await require_league_admin(session, league.id, current_user)

    member = await league_repository.get_member(session, league.id, user_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="League member not found")
    if member.role == LeagueMemberRole.LEAGUE_ADMIN and not _is_superadmin(current_user):
        admin_members = [
            item for item in await league_repository.get_members(session, league.id) if item.role == LeagueMemberRole.LEAGUE_ADMIN
        ]
        if len(admin_members) <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="League must keep at least one active admin",
            )

    member.left_at = datetime.now(timezone.utc).replace(tzinfo=None)
    return await league_repository.remove_member(session, member)


async def get_leagues_for_user(session: AsyncSession, user: User) -> list[League]:
    if _is_superadmin(user):
        return await league_repository.get_all(session)
    return await league_repository.get_leagues_for_user(session, user.id)
