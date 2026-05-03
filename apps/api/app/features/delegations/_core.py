from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.delegation import (
    Delegation,
    DelegationMember,
    DelegationMemberRole,
)
from app.domain.models.league import LeagueMember, LeagueMemberRole
from app.domain.models.league_delegation import LeagueDelegation
from app.domain.models.user import User
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
from app.features.delegations import repository as delegation_repository
from app.features.delegations._helpers import generate_code


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


async def get_delegation_leagues(session: AsyncSession, delegation_id: int) -> list:
    from app.domain.models.league import League

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
    code = data.code or generate_code(data.name)
    if await delegation_repository.get_by_code(session, code, league_id) is not None:
        code = generate_code(data.name)
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
        from datetime import timezone

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


async def get_current_delegation_id(
    session: AsyncSession, user_id: int, league_id: int | None = None
) -> int | None:
    return await delegation_repository.get_current_delegation_id(
        session, user_id, league_id
    )
