import secrets
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.delegation import (
    Delegation,
    DelegationInvite,
    DelegationMember,
    DelegationMemberRole,
    InviteStatus,
)
from app.models.user import NotificationType, User, UserRole
from app.repositories import delegation_repository, user_repository
from app.schemas.delegation import (
    DelegationCreate,
    DelegationDetailResponse,
    DelegationStatisticsResponse,
    DelegationResponse,
    DelegationAthleteStatisticsItem,
    DelegationMedalItem,
    DelegationWeekPerformanceItem,
    DelegationUpdate,
    InviteResponse,
    MemberHistoryItem,
    MemberInfo,
)
from app.services import notification_service

_MOCK_DELEGATIONS = [
    ("MEX", "México"),
    ("USA", "Estados Unidos"),
    ("FRA", "França"),
    ("ITA", "Itália"),
    ("GER", "Alemanha"),
    ("JPN", "Japão"),
    ("CHN", "China"),
    ("AUS", "Austrália"),
    ("NED", "Holanda"),
    ("GBR", "Reino Unido"),
    ("RUS", "Rússia"),
    ("CAN", "Canadá"),
    ("KOR", "Coreia do Sul"),
    ("CUB", "Cuba"),
    ("KEN", "Quênia"),
]


def _is_transfer_window_open() -> bool:
    return datetime.now(ZoneInfo(settings.TIMEZONE)).weekday() == 0


def _next_transfer_window_iso() -> str:
    now = datetime.now(ZoneInfo(settings.TIMEZONE))
    days_ahead = (7 - now.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    next_monday = (now + timedelta(days=days_ahead)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return next_monday.isoformat()


def _generate_code(name: str) -> str:
    base = "".join(c for c in name.upper() if c.isalpha())[:4] or "DEL"
    return base + secrets.token_hex(2).upper()


async def list_delegations(
    session: AsyncSession, page: int, per_page: int
) -> tuple[list[Delegation], int]:
    return await delegation_repository.list_active(session, page, per_page)


async def get_delegation(session: AsyncSession, delegation_id: int) -> Delegation:
    delegation = await delegation_repository.get_by_id(session, delegation_id)
    if delegation is None or not delegation.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found")
    return delegation


async def get_delegation_detail(
    session: AsyncSession, delegation_id: int
) -> DelegationDetailResponse:
    delegation = await get_delegation(session, delegation_id)
    rows = await delegation_repository.get_active_members_with_users(session, delegation_id)
    members = [
        MemberInfo(
            id=m.id,  # type: ignore[arg-type]
            user_id=m.user_id,
            user_name=u.name,
            role=m.role,
            joined_at=m.joined_at,
            left_at=m.left_at,
        )
        for m, u in rows
    ]
    return DelegationDetailResponse(**DelegationResponse.model_validate(delegation).model_dump(), members=members)


async def get_delegation_statistics(
    session: AsyncSession, delegation_id: int
) -> DelegationStatisticsResponse:
    delegation = await get_delegation(session, delegation_id)
    athlete_rows = await delegation_repository.get_athlete_statistics(session, delegation_id)
    medal_rows = await delegation_repository.get_medal_entries(session, delegation_id)
    weekly_rows = await delegation_repository.get_weekly_performance(session, delegation_id)

    athletes = [
        DelegationAthleteStatisticsItem(
            athlete_id=row["athlete_id"],
            athlete_name=row["athlete_name"],
            athlete_code=row["athlete_code"],
            is_active=row["is_active"],
            is_current_member=row["is_current_member"],
            joined_at=row["joined_at"],
            left_at=row["left_at"],
            total_matches=row["total_matches"],
            gold=row["gold"],
            silver=row["silver"],
            bronze=row["bronze"],
            total_medals=row["gold"] + row["silver"] + row["bronze"],
        )
        for row in athlete_rows
    ]
    medals = [DelegationMedalItem(**row) for row in medal_rows]
    weekly_performance = [
        DelegationWeekPerformanceItem(
            competition_id=row["competition_id"],
            number=row["number"],
            status=row["status"],
            start_date=row["start_date"],
            end_date=row["end_date"],
            matches_played=row["matches_played"],
            matches_completed=row["matches_completed"],
            wins=row["wins"],
            gold=row["gold"],
            silver=row["silver"],
            bronze=row["bronze"],
            total_medals=row["gold"] + row["silver"] + row["bronze"],
        )
        for row in weekly_rows
    ]

    total_matches = sum(item.matches_played for item in weekly_performance)
    total_wins = sum(item.wins for item in weekly_performance)
    gold = sum(item.gold for item in weekly_performance)
    silver = sum(item.silver for item in weekly_performance)
    bronze = sum(item.bronze for item in weekly_performance)

    return DelegationStatisticsResponse(
        delegation=DelegationResponse.model_validate(delegation),
        athlete_count=len(athletes),
        active_athlete_count=sum(1 for item in athletes if item.is_current_member and item.is_active),
        total_matches=total_matches,
        total_wins=total_wins,
        gold=gold,
        silver=silver,
        bronze=bronze,
        total_medals=gold + silver + bronze,
        athletes=athletes,
        medals=medals,
        weekly_performance=weekly_performance,
    )


async def create_delegation(session: AsyncSession, data: DelegationCreate, admin: User) -> Delegation:
    code = data.code or _generate_code(data.name)
    if await delegation_repository.get_by_code(session, code) is not None:
        code = _generate_code(data.name)
    delegation = Delegation(code=code, name=data.name, flag_url=data.flag_url)
    return await delegation_repository.create(session, delegation)


async def update_delegation(
    session: AsyncSession, delegation_id: int, data: DelegationUpdate, user: User
) -> Delegation:
    delegation = await get_delegation(session, delegation_id)
    _assert_can_manage(delegation, user)
    if not data.has_updates():
        return delegation
    if data.name is not None:
        delegation.name = data.name
    if data.flag_url is not None:
        delegation.flag_url = data.flag_url
    return await delegation_repository.save(session, delegation)


async def archive_delegation(session: AsyncSession, delegation_id: int, admin: User) -> None:
    delegation = await get_delegation(session, delegation_id)
    delegation.is_active = False
    await delegation_repository.save(session, delegation)


async def invite_user(
    session: AsyncSession, delegation_id: int, user_id: int, chief: User
) -> DelegationInvite:
    delegation = await get_delegation(session, delegation_id)
    _assert_is_chief(delegation, chief)

    target_user = await user_repository.get_by_id(session, user_id)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = await delegation_repository.get_pending_invites(session, delegation_id)
    if any(inv.user_id == user_id for inv in existing):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite already pending for this user")

    invite = DelegationInvite(delegation_id=delegation_id, user_id=user_id)
    await delegation_repository.create_invite(session, invite)

    await notification_service.dispatch(
        session,
        user_id,
        NotificationType.INVITE,
        {"delegation_id": delegation_id, "delegation_name": delegation.name, "invite_id": invite.id},
    )
    return invite


async def list_invites(session: AsyncSession, delegation_id: int, chief: User) -> list[DelegationInvite]:
    delegation = await get_delegation(session, delegation_id)
    _assert_is_chief(delegation, chief)
    return await delegation_repository.get_pending_invites(session, delegation_id)


async def revoke_invite(
    session: AsyncSession, delegation_id: int, invite_id: int, chief: User
) -> None:
    delegation = await get_delegation(session, delegation_id)
    _assert_is_chief(delegation, chief)

    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.delegation_id != delegation_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved")

    invite.status = InviteStatus.REFUSED
    await delegation_repository.save_invite(session, invite)


async def accept_invite(
    session: AsyncSession, invite_id: int, user: User
) -> DelegationMember:
    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved")

    now = datetime.now(UTC).replace(tzinfo=None)

    current = await delegation_repository.get_active_membership(session, user.id)
    if current is not None:
        current.left_at = now
        await delegation_repository.save_member(session, current)

    invite.status = InviteStatus.ACCEPTED
    await delegation_repository.save_invite(session, invite)

    member = DelegationMember(
        delegation_id=invite.delegation_id,
        user_id=user.id,
        role=DelegationMemberRole.ATHLETE,
    )
    return await delegation_repository.create_member(session, member)


async def refuse_invite(session: AsyncSession, invite_id: int, user: User) -> None:
    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved")

    invite.status = InviteStatus.REFUSED
    await delegation_repository.save_invite(session, invite)


async def transfer_athlete(
    session: AsyncSession, delegation_id: int, user_id: int, chief: User
) -> DelegationInvite:
    if not _is_transfer_window_open():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Transfer window closed. Next window: {_next_transfer_window_iso()}",
        )

    delegation = await get_delegation(session, delegation_id)
    _assert_is_chief(delegation, chief)

    target_user = await user_repository.get_by_id(session, user_id)
    if target_user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    current_membership = await delegation_repository.get_active_membership(session, user_id)
    if current_membership is None or current_membership.delegation_id == delegation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not in a different delegation",
        )

    existing = await delegation_repository.get_pending_invites(session, delegation_id)
    if any(inv.user_id == user_id for inv in existing):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Transfer already pending for this user")

    invite = DelegationInvite(delegation_id=delegation_id, user_id=user_id)
    await delegation_repository.create_invite(session, invite)

    await notification_service.dispatch(
        session,
        user_id,
        NotificationType.TRANSFER,
        {"delegation_id": delegation_id, "delegation_name": delegation.name, "invite_id": invite.id},
    )
    return invite


async def get_member_history(
    session: AsyncSession, delegation_id: int
) -> list[MemberHistoryItem]:
    await get_delegation(session, delegation_id)
    rows = await delegation_repository.get_member_history_with_users(session, delegation_id)
    return [
        MemberHistoryItem(
            id=m.id,  # type: ignore[arg-type]
            user_id=m.user_id,
            user_name=u.name,
            role=m.role,
            joined_at=m.joined_at,
            left_at=m.left_at,
        )
        for m, u in rows
    ]


async def ai_generate(session: AsyncSession, count: int) -> list[Delegation]:
    used_codes = set()
    created: list[Delegation] = []
    pool = _MOCK_DELEGATIONS[:]

    for i in range(min(count, len(pool))):
        code, name = pool[i]
        if await delegation_repository.get_by_code(session, code) is not None or code in used_codes:
            code = _generate_code(name)
        used_codes.add(code)
        delegation = Delegation(code=code, name=name)
        await delegation_repository.create(session, delegation)
        created.append(delegation)

    return created


async def get_current_delegation_id(session: AsyncSession, user_id: int) -> int | None:
    return await delegation_repository.get_current_delegation_id(session, user_id)


def _assert_can_manage(delegation: Delegation, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.CHIEF and delegation.chief_id == user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage this delegation")


def _assert_is_chief(delegation: Delegation, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.CHIEF and delegation.chief_id == user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the delegation chief can perform this action")
