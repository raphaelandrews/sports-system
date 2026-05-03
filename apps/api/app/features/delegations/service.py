import secrets
from datetime import UTC, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.delegation import (
    Delegation,
    DelegationInvite,
    DelegationMember,
    DelegationMemberRole,
    DelegationStatus,
    InviteStatus,
    LeagueParticipationRequest,
)
from app.domain.models.league import League, LeagueMember, LeagueMemberRole
from app.domain.models.league_delegation import LeagueDelegation
from app.domain.models.user import NotificationType, User
from app.features.delegations import repository as delegation_repository
from app.features.leagues import repository as league_repository
from app.features.auth import user_repository
from app.domain.schemas.delegation import (
    DelegationAthleteStatisticsItem,
    DelegationCreate,
    DelegationDetailResponse,
    DelegationMedalItem,
    DelegationResponse,
    DelegationStatisticsResponse,
    DelegationUpdate,
    DelegationWeekPerformanceItem,
    MemberHistoryItem,
    MemberInfo,
)
from app.features.notifications import service as notification_service

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


def _is_transfer_window_open(timezone_name: str) -> bool:
    return datetime.now(ZoneInfo(timezone_name)).weekday() == 0


def _next_transfer_window_iso(timezone_name: str) -> str:
    now = datetime.now(ZoneInfo(timezone_name))
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
    session: AsyncSession, league_id: int, page: int, per_page: int
) -> tuple[list[Delegation], int]:
    return await delegation_repository.list_active(session, league_id, page, per_page)


async def list_delegations_by_chief(
    session: AsyncSession, chief_id: int
) -> list[Delegation]:
    return await delegation_repository.get_by_chief(session, chief_id)


async def get_delegation(
    session: AsyncSession, league_id: int | None, delegation_id: int
) -> Delegation:
    if league_id is not None:
        delegation = await delegation_repository.get_by_id_in_league(
            session, league_id, delegation_id
        )
    else:
        delegation = await delegation_repository.get_by_id(session, delegation_id)
    if delegation is None or not delegation.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found"
        )
    return delegation


async def get_delegation_detail(
    session: AsyncSession, league_id: int | None, delegation_id: int
) -> DelegationDetailResponse:
    delegation = await get_delegation(session, league_id, delegation_id)
    rows = await delegation_repository.get_active_members_with_users(
        session, delegation_id
    )
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
    return DelegationDetailResponse(
        **DelegationResponse.model_validate(delegation).model_dump(),
        members=members,
    )


async def get_delegation_leagues(
    session: AsyncSession, delegation_id: int
) -> list[League]:
    return list(
        await delegation_repository.get_leagues_for_delegation(session, delegation_id)
    )


async def get_delegation_statistics(
    session: AsyncSession, league_id: int, delegation_id: int
) -> DelegationStatisticsResponse:
    delegation = await get_delegation(session, league_id, delegation_id)
    athlete_rows = await delegation_repository.get_athlete_statistics(
        session, delegation_id
    )
    medal_rows = await delegation_repository.get_medal_entries(session, delegation_id)
    weekly_rows = await delegation_repository.get_weekly_performance(
        session, delegation_id
    )

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
        active_athlete_count=sum(
            1 for item in athletes if item.is_current_member and item.is_active
        ),
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


async def create_delegation(
    session: AsyncSession,
    data: DelegationCreate,
    league_id: int | None = None,
    creator: User | None = None,
) -> Delegation:
    code = data.code or _generate_code(data.name)
    if await delegation_repository.get_by_code(session, code, league_id) is not None:
        code = _generate_code(data.name)
    delegation = Delegation(
        league_id=league_id,
        code=code,
        name=data.name,
        flag_url=data.flag_url,
        chief_id=creator.id if creator else None,
    )
    result = await delegation_repository.create(session, delegation)
    assert result.id is not None
    if league_id is not None:
        session.add(LeagueDelegation(league_id=league_id, delegation_id=result.id))
    if creator is not None:
        assert creator.id is not None
        session.add(
            DelegationMember(
                delegation_id=result.id,
                user_id=creator.id,
                role=DelegationMemberRole.CHIEF,
            )
        )
        await session.flush()
    return result


async def update_delegation(
    session: AsyncSession,
    league_id: int | None,
    delegation_id: int,
    data: DelegationUpdate,
    member: LeagueMember | None = None,
) -> Delegation:
    delegation = await get_delegation(session, league_id, delegation_id)
    if member is not None and member.role == LeagueMemberRole.CHIEF:
        membership = (
            await delegation_repository.get_active_membership(
                session, member.user_id, league_id
            )
            if league_id is not None
            else None
        )
        if membership is None or membership.delegation_id != delegation_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own delegation",
            )
    if not data.has_updates():
        return delegation
    if data.name is not None:
        delegation.name = data.name
    if data.flag_url is not None:
        delegation.flag_url = data.flag_url
    return await delegation_repository.save(session, delegation)


async def archive_delegation(
    session: AsyncSession, league_id: int | None, delegation_id: int
) -> None:
    delegation = await get_delegation(session, league_id, delegation_id)
    delegation.is_active = False
    await delegation_repository.save(session, delegation)


async def assign_chief(
    session: AsyncSession, league_id: int, delegation_id: int, user_id: int
) -> Delegation:
    from app.features.leagues import repository as league_repository

    delegation = await get_delegation(session, league_id, delegation_id)

    # Update or create league membership
    existing_member = await league_repository.get_member(session, league_id, user_id)
    if existing_member is not None:
        existing_member.role = LeagueMemberRole.CHIEF
    else:
        session.add(
            LeagueMember(
                league_id=league_id,
                user_id=user_id,
                role=LeagueMemberRole.CHIEF,
            )
        )

    # Add as delegation member if not already
    existing_delegation_member = await delegation_repository.get_active_membership(
        session, user_id, league_id
    )
    if existing_delegation_member is None:
        session.add(
            DelegationMember(
                delegation_id=delegation_id,
                user_id=user_id,
                role=DelegationMemberRole.CHIEF,
            )
        )
    elif existing_delegation_member.delegation_id != delegation_id:
        # Leave current delegation and join new one
        existing_delegation_member.left_at = datetime.now(timezone.utc).replace(
            tzinfo=None
        )
        session.add(
            DelegationMember(
                delegation_id=delegation_id,
                user_id=user_id,
                role=DelegationMemberRole.CHIEF,
            )
        )
    else:
        existing_delegation_member.role = DelegationMemberRole.CHIEF

    delegation.chief_id = user_id
    return await delegation_repository.save(session, delegation)


async def invite_user(
    session: AsyncSession,
    league_id: int,
    delegation_id: int,
    user_id: int,
) -> DelegationInvite:
    delegation = await get_delegation(session, league_id, delegation_id)

    target_user = await user_repository.get_by_id(session, user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing = await delegation_repository.get_pending_invites(session, delegation_id)
    if any(inv.user_id == user_id for inv in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Invite already pending for this user",
        )

    invite = DelegationInvite(delegation_id=delegation_id, user_id=user_id)
    await delegation_repository.create_invite(session, invite)

    await notification_service.dispatch(
        session,
        user_id,
        NotificationType.INVITE,
        {
            "delegation_id": delegation_id,
            "delegation_name": delegation.name,
            "invite_id": invite.id,
        },
    )
    return invite


async def list_invites(
    session: AsyncSession, league_id: int, delegation_id: int
) -> list[DelegationInvite]:
    await get_delegation(session, league_id, delegation_id)
    return await delegation_repository.get_pending_invites(session, delegation_id)


async def revoke_invite(
    session: AsyncSession, league_id: int, delegation_id: int, invite_id: int
) -> None:
    await get_delegation(session, league_id, delegation_id)

    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.delegation_id != delegation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved"
        )

    invite.status = InviteStatus.REFUSED
    await delegation_repository.save_invite(session, invite)


async def accept_invite(
    session: AsyncSession, invite_id: int, user: User
) -> DelegationMember:
    invite = await delegation_repository.get_invite_by_id(session, invite_id)
    if invite is None or invite.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved"
        )

    target_delegation = await delegation_repository.get_by_id(
        session, invite.delegation_id
    )
    if target_delegation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Delegation not found"
        )

    now = datetime.now(UTC).replace(tzinfo=None)
    assert user.id is not None
    assert target_delegation.league_id is not None
    current = await delegation_repository.get_active_membership(
        session, user.id, target_delegation.league_id
    )
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found"
        )
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Invite already resolved"
        )

    invite.status = InviteStatus.REFUSED
    await delegation_repository.save_invite(session, invite)


async def transfer_athlete(
    session: AsyncSession,
    league_id: int,
    delegation_id: int,
    user_id: int,
) -> DelegationInvite:
    league = await league_repository.get_by_id(session, league_id)
    if league is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="League not found"
        )

    if league.transfer_window_enabled and not _is_transfer_window_open(league.timezone):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Transfer window closed. Next window: {_next_transfer_window_iso(league.timezone)}",
        )

    delegation = await get_delegation(session, league_id, delegation_id)

    target_user = await user_repository.get_by_id(session, user_id)
    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    current_membership = await delegation_repository.get_active_membership(
        session, user_id, league_id
    )
    if current_membership is None or current_membership.delegation_id == delegation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not in a different delegation",
        )

    existing = await delegation_repository.get_pending_invites(session, delegation_id)
    if any(inv.user_id == user_id for inv in existing):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Transfer already pending for this user",
        )

    invite = DelegationInvite(delegation_id=delegation_id, user_id=user_id)
    await delegation_repository.create_invite(session, invite)

    await notification_service.dispatch(
        session,
        user_id,
        NotificationType.TRANSFER,
        {
            "delegation_id": delegation_id,
            "delegation_name": delegation.name,
            "invite_id": invite.id,
        },
    )
    return invite


async def get_member_history(
    session: AsyncSession, league_id: int, delegation_id: int
) -> list[MemberHistoryItem]:
    await get_delegation(session, league_id, delegation_id)
    rows = await delegation_repository.get_member_history_with_users(
        session, delegation_id
    )
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


async def ai_generate(
    session: AsyncSession, league_id: int, count: int
) -> list[Delegation]:
    from sqlalchemy import select
    from app.domain.models.delegation import Delegation

    result = await session.execute(select(Delegation))
    existing_codes = {d.code for d in result.scalars().all()}

    used_codes = set(existing_codes)
    created: list[Delegation] = []
    pool = [item for item in _MOCK_DELEGATIONS if item[0] not in existing_codes]

    for i in range(min(count, len(pool))):
        code, name = pool[i]
        if code in used_codes:
            code = _generate_unique_code(name, used_codes)
        used_codes.add(code)
        delegation = Delegation(league_id=league_id, code=code, name=name)
        await delegation_repository.create(session, delegation)
        assert delegation.id is not None
        session.add(LeagueDelegation(league_id=league_id, delegation_id=delegation.id))
        created.append(delegation)

    return created


def _generate_unique_code(name: str, used_codes: set[str]) -> str:
    code = _generate_code(name)
    while code in used_codes:
        code = _generate_code(name)
    return code


async def ai_populate(
    session: AsyncSession, league_id: int, count: int
) -> list[Delegation]:
    from sqlalchemy import select
    from app.features.narratives import ai as ai_service
    from app.domain.models.delegation import Delegation

    from app.domain.models.league_delegation import LeagueDelegation

    result = await session.execute(
        select(Delegation)
        .join(LeagueDelegation, LeagueDelegation.delegation_id == Delegation.id)  # type: ignore[arg-type]
        .where(
            LeagueDelegation.league_id == league_id,  # type: ignore[arg-type]
            Delegation.is_active == True,  # type: ignore[arg-type]
        )
    )
    existing_delegations = result.scalars().all()
    existing_data = [(d.code, d.name) for d in existing_delegations]

    all_codes_result = await session.execute(select(Delegation))
    all_existing_codes = {d.code for d in all_codes_result.scalars().all()}

    if not existing_data:
        return await ai_generate(session, league_id, count)

    prompt = (
        f"A liga já tem estas delegações: {existing_data}. "
        f"Gere {count} novas delegações no formato JSON: "
        '[{"code": "ABC", "name": "Nome da Delegação"}, ...]. '
        "Use códigos de 3 letras maiúsculas e nomes criativos de países, estados ou cidades. "
        "Apenas o JSON, sem texto adicional."
    )

    raw = await ai_service.generate_text(
        "Você é um assistente que gera dados de delegações esportivas.",
        prompt,
        max_tokens=800,
    )

    import json
    import re

    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if not match:
        return []

    try:
        items = json.loads(match.group())
    except json.JSONDecodeError:
        return []

    created: list[Delegation] = []
    used_codes = set(all_existing_codes)

    for item in items[:count]:
        code = item.get("code", "")
        name = item.get("name", "")
        if not code or not name:
            continue
        code = code.upper()[:4]
        if code in used_codes:
            code = _generate_unique_code(name, used_codes)
        used_codes.add(code)
        delegation = Delegation(code=code, name=name)
        await delegation_repository.create(session, delegation)
        assert delegation.id is not None
        session.add(LeagueDelegation(league_id=league_id, delegation_id=delegation.id))
        created.append(delegation)

    return created


async def get_current_delegation_id(
    session: AsyncSession, user_id: int, league_id: int | None = None
) -> int | None:
    return await delegation_repository.get_current_delegation_id(
        session, user_id, league_id
    )


async def ai_generate_independent(
    session: AsyncSession,
    prompt: str,
    count: int,
    creator: User,
) -> list[Delegation]:
    from sqlalchemy import select
    from app.features.narratives import ai as ai_service
    from app.domain.models.delegation import Delegation

    result = await session.execute(select(Delegation))
    existing_codes = {d.code for d in result.scalars().all()}
    used_codes = set(existing_codes)

    system_prompt = (
        "Você é um assistente que gera dados de delegações esportivas. "
        "Responda APENAS com um array JSON no formato: "
        '[{"code": "ABC", "name": "Nome da Delegação"}, ...]'
    )

    user_prompt = (
        f"{prompt}. Gere exatamente {count} delegações. "
        f"Use códigos únicos de 3 letras maiúsculas. "
        f"Códigos já usados (não repita): {sorted(existing_codes)[:20]}. "
        "Apenas o JSON, sem texto adicional."
    )

    raw = await ai_service.generate_text(
        system_prompt,
        user_prompt,
        max_tokens=1200,
    )

    import json
    import re

    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="AI did not return valid JSON",
        )

    try:
        items = json.loads(match.group())
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="AI returned malformed JSON",
        )

    created: list[Delegation] = []

    for item in items[:count]:
        code = item.get("code", "")
        name = item.get("name", "")
        if not code or not name:
            continue
        code = code.upper()[:4]
        if code in used_codes:
            code = _generate_unique_code(name, used_codes)
        used_codes.add(code)
        delegation = Delegation(
            code=code,
            name=name,
            chief_id=creator.id,
            status=DelegationStatus.INDEPENDENT,
        )
        await delegation_repository.create(session, delegation)
        assert delegation.id is not None
        if creator.id is not None:
            session.add(
                DelegationMember(
                    delegation_id=delegation.id,
                    user_id=creator.id,
                    role=DelegationMemberRole.CHIEF,
                )
            )
        created.append(delegation)

    return created


async def create_participation_request(
    session: AsyncSession,
    delegation_id: int,
    league_id: int,
    current_user: User,
) -> LeagueParticipationRequest:
    delegation = await get_delegation(session, None, delegation_id)
    if current_user.id is None or delegation.chief_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the chief can request participation",
        )

    existing = await delegation_repository.list_participation_requests_for_delegation(
        session, delegation_id
    )
    for req in existing:
        if req.league_id == league_id and req.status == "PENDING":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending request for this league already exists",
            )

    league = await league_repository.get_by_id(session, league_id)
    if league is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found",
        )

    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized",
        )

    request = LeagueParticipationRequest(
        delegation_id=delegation_id,
        league_id=league_id,
        requested_by=current_user.id,
    )
    await delegation_repository.create_participation_request(session, request)
    await session.commit()
    await session.refresh(request)

    # Notify league admins
    league_members = await league_repository.get_members(session, league_id)
    for member in league_members:
        if member.role == LeagueMemberRole.LEAGUE_ADMIN and member.user_id is not None:
            await notification_service.dispatch(
                session,
                member.user_id,
                NotificationType.PARTICIPATION_REQUEST,
                {
                    "request_id": request.id,
                    "delegation_id": delegation_id,
                    "delegation_name": delegation.name,
                    "league_id": league_id,
                    "league_name": league.name,
                },
            )

    return request


async def list_participation_requests_for_league(
    session: AsyncSession,
    league_id: int,
    current_user: User,
) -> list[LeagueParticipationRequest]:
    from app.domain.models.league import LeagueMemberRole

    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized",
        )

    membership = await league_repository.get_member(session, league_id, current_user.id)
    if membership is None or membership.role != LeagueMemberRole.LEAGUE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league admins can view requests",
        )

    return list(
        await delegation_repository.list_participation_requests_for_league(
            session, league_id
        )
    )


async def review_participation_request(
    session: AsyncSession,
    league_id: int,
    request_id: int,
    new_status: str,
    current_user: User,
) -> LeagueParticipationRequest:
    from app.domain.models.delegation import DelegationStatus
    from app.domain.models.league import LeagueMemberRole

    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized",
        )

    membership = await league_repository.get_member(session, league_id, current_user.id)
    if membership is None or membership.role != LeagueMemberRole.LEAGUE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league admins can review requests",
        )

    request = await delegation_repository.get_participation_request_by_id(
        session, request_id
    )
    if request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found",
        )
    if request.league_id != league_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request does not belong to this league",
        )

    if new_status not in ("APPROVED", "REJECTED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be APPROVED or REJECTED",
        )

    request.status = DelegationStatus(new_status)
    request.reviewed_by = current_user.id

    if new_status == "APPROVED":
        existing = await delegation_repository.get_league_delegation(
            session, league_id, request.delegation_id
        )
        if existing is None:
            session.add(
                LeagueDelegation(
                    league_id=league_id,
                    delegation_id=request.delegation_id,
                )
            )

    await session.commit()
    await session.refresh(request)

    # Notify delegation chief
    delegation = await get_delegation(session, None, request.delegation_id)
    league = await league_repository.get_by_id(session, league_id)
    if delegation.chief_id is not None:
        await notification_service.dispatch(
            session,
            delegation.chief_id,
            NotificationType.REQUEST_REVIEWED,
            {
                "request_id": request.id,
                "delegation_id": delegation.id,
                "delegation_name": delegation.name,
                "league_id": league_id,
                "league_name": league.name if league else None,
                "status": new_status,
            },
        )

    return request
