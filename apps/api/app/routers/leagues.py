from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import (
    get_current_user,
    require_league_admin,
    require_league_member,
)
from app.database import get_session
from app.models.league import LeagueMember, LeagueMemberRole
from app.models.user import User
from app.schemas.league import (
    LeagueCreate,
    LeagueMemberResponse,
    LeagueMemberRoleUpdate,
    LeagueResponse,
    LeagueUpdate,
)
from app.services import league_service
from app.repositories import league_repository

router = APIRouter(prefix="/leagues", tags=["leagues"])


async def _to_league_response(session: AsyncSession, league_id: int) -> LeagueResponse:
    league = await league_service.get_league_or_404(session, league_id)
    member_count = await league_repository.get_member_count(session, league_id)
    return LeagueResponse.model_validate(league, update={"member_count": member_count})


@router.get("", response_model=list[LeagueResponse])
async def list_leagues(
    session: AsyncSession = Depends(get_session),
) -> list[LeagueResponse]:
    leagues = await league_repository.get_all(session)
    responses: list[LeagueResponse] = []
    for league in leagues:
        member_count = await league_repository.get_member_count(session, league.id)
        responses.append(LeagueResponse.model_validate(league, update={"member_count": member_count}))
    return responses


@router.post("", response_model=LeagueResponse, status_code=status.HTTP_201_CREATED)
async def create_league(
    data: LeagueCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> LeagueResponse:
    league = await league_service.create_league(session, data, current_user)
    await session.commit()
    return await _to_league_response(session, league.id)


@router.get("/my", response_model=list[LeagueResponse])
async def get_my_leagues(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[LeagueResponse]:
    leagues = await league_service.get_leagues_for_user(session, current_user)
    responses: list[LeagueResponse] = []
    for league in leagues:
        member_count = await league_repository.get_member_count(session, league.id)
        responses.append(LeagueResponse.model_validate(league, update={"member_count": member_count}))
    return responses


@router.get("/{league_id}", response_model=LeagueResponse)
async def get_league(
    league_id: int,
    session: AsyncSession = Depends(get_session),
) -> LeagueResponse:
    return await _to_league_response(session, league_id)


@router.patch("/{league_id}", response_model=LeagueResponse)
async def update_league(
    league_id: int,
    data: LeagueUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    _: LeagueMember = Depends(require_league_admin()),
) -> LeagueResponse:
    league = await league_service.update_league(session, league_id, data, current_user)
    await session.commit()
    return await _to_league_response(session, league.id)


@router.delete("/{league_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_league(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    await league_service.archive_league(session, league_id, current_user)
    await session.commit()


@router.get("/{league_id}/members", response_model=list[LeagueMemberResponse])
async def list_members(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_member()),
) -> list[LeagueMemberResponse]:
    await league_service.get_league_or_404(session, league_id)
    members = await league_repository.get_members(session, league_id)
    return [LeagueMemberResponse.model_validate(member) for member in members]


@router.get("/{league_id}/members/me", response_model=LeagueMemberResponse)
async def get_my_membership(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> LeagueMemberResponse:
    await league_service.get_league_or_404(session, league_id)
    member = await league_service.get_member_or_403(session, league_id, current_user)
    return LeagueMemberResponse.model_validate(member)


@router.patch("/{league_id}/members/{user_id}", response_model=LeagueMemberResponse)
async def update_member_role(
    league_id: int,
    user_id: int,
    data: LeagueMemberRoleUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    _: LeagueMember = Depends(require_league_admin()),
) -> LeagueMemberResponse:
    member = await league_service.update_member_role(session, league_id, user_id, data, current_user)
    await session.commit()
    return LeagueMemberResponse.model_validate(member)


@router.delete("/{league_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    league_id: int,
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    await league_service.remove_member(session, league_id, user_id, current_user)
    await session.commit()

