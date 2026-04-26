from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.shared.core.deps import require_league_admin
from app.database import get_session
from app.domain.models.league import LeagueMember
from app.domain.schemas.report import AthleteReportResponse, CompetitionReportResponse, FinalReportResponse
from app.features.reports import service as report_service

router = APIRouter(prefix="/leagues/{league_id}/report", tags=["reports"])


@router.get("/final", response_model=FinalReportResponse)
async def get_final_report(league_id: int, session: AsyncSession = Depends(get_session)) -> FinalReportResponse:
    return await report_service.get_final_report(session, league_id)


@router.get("/competition/{competition_id}", response_model=CompetitionReportResponse)
async def get_competition_report(league_id: int, competition_id: int, session: AsyncSession = Depends(get_session)) -> CompetitionReportResponse:
    return await report_service.get_competition_report(session, league_id, competition_id)


@router.get("/athlete/{athlete_id}", response_model=AthleteReportResponse)
async def get_athlete_report(league_id: int, athlete_id: int, session: AsyncSession = Depends(get_session)) -> AthleteReportResponse:
    return await report_service.get_athlete_report(session, league_id, athlete_id)


@router.get("/export/csv")
async def export_csv(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> StreamingResponse:
    content = await report_service.export_csv(session, league_id)
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )


@router.get("/export/xlsx")
async def export_xlsx(
    league_id: int,
    session: AsyncSession = Depends(get_session),
    _: LeagueMember = Depends(require_league_admin()),
) -> StreamingResponse:
    content = await report_service.export_xlsx(session, league_id)
    return StreamingResponse(
        iter([content]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=results.xlsx"},
    )
