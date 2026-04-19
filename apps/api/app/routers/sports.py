from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.database import get_session
from app.models.user import User
from app.schemas.common import Meta, PaginatedResponse
from app.schemas.sport import (
    ModalityCreate,
    ModalityResponse,
    ModalityUpdate,
    SportCreate,
    SportDetailResponse,
    SportResponse,
    SportUpdate,
)
from app.services import sport_service

router = APIRouter(prefix="/sports", tags=["sports"])
modalities_router = APIRouter(prefix="/modalities", tags=["modalities"])


@router.get("", response_model=PaginatedResponse[SportResponse])
async def list_sports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[SportResponse]:
    sports, total = await sport_service.list_sports(session, page, per_page)
    return PaginatedResponse(
        data=[SportResponse.model_validate(s) for s in sports],
        meta=Meta(total=total, page=page, per_page=per_page),
    )


@router.post("/ai-generate", response_model=list[SportResponse], status_code=status.HTTP_201_CREATED)
async def ai_generate_sports(
    count: int = Query(3, ge=1, le=5),
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> list[SportResponse]:
    sports = await sport_service.ai_generate(session, count)
    await session.commit()
    for s in sports:
        await session.refresh(s)
    return [SportResponse.model_validate(s) for s in sports]


@router.post("", response_model=SportResponse, status_code=status.HTTP_201_CREATED)
async def create_sport(
    data: SportCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> SportResponse:
    sport = await sport_service.create_sport(session, data)
    await session.commit()
    await session.refresh(sport)
    return SportResponse.model_validate(sport)


@router.get("/{sport_id}", response_model=SportDetailResponse)
async def get_sport(
    sport_id: int,
    session: AsyncSession = Depends(get_session),
) -> SportDetailResponse:
    return await sport_service.get_sport_detail(session, sport_id)


@router.patch("/{sport_id}", response_model=SportResponse)
async def update_sport(
    sport_id: int,
    data: SportUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> SportResponse:
    sport = await sport_service.update_sport(session, sport_id, data)
    await session.commit()
    await session.refresh(sport)
    return SportResponse.model_validate(sport)


@router.delete("/{sport_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_sport(
    sport_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> None:
    await sport_service.archive_sport(session, sport_id)
    await session.commit()


@router.post("/{sport_id}/modalities", response_model=ModalityResponse, status_code=status.HTTP_201_CREATED)
async def create_modality(
    sport_id: int,
    data: ModalityCreate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> ModalityResponse:
    modality = await sport_service.create_modality(session, sport_id, data)
    await session.commit()
    await session.refresh(modality)
    return ModalityResponse.model_validate(modality)


@modalities_router.patch("/{modality_id}", response_model=ModalityResponse)
async def update_modality(
    modality_id: int,
    data: ModalityUpdate,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> ModalityResponse:
    modality = await sport_service.update_modality(session, modality_id, data)
    await session.commit()
    await session.refresh(modality)
    return ModalityResponse.model_validate(modality)


@modalities_router.delete("/{modality_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_modality(
    modality_id: int,
    session: AsyncSession = Depends(get_session),
    _: User = Depends(require_admin),
) -> None:
    await sport_service.archive_modality(session, modality_id)
    await session.commit()
