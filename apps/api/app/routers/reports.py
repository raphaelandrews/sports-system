from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_admin
from app.database import get_session
from app.schemas.report import AthleteReportResponse, FinalReportResponse, WeekReportResponse
from app.services import report_service

router = APIRouter(prefix="/report", tags=["reports"])


@router.get("/final", response_model=FinalReportResponse)
async def get_final_report(session: AsyncSession = Depends(get_session)) -> FinalReportResponse:
    return await report_service.get_final_report(session)


@router.get("/week/{week_id}", response_model=WeekReportResponse)
async def get_week_report(week_id: int, session: AsyncSession = Depends(get_session)) -> WeekReportResponse:
    return await report_service.get_week_report(session, week_id)


@router.get("/athlete/{athlete_id}", response_model=AthleteReportResponse)
async def get_athlete_report(athlete_id: int, session: AsyncSession = Depends(get_session)) -> AthleteReportResponse:
    return await report_service.get_athlete_report(session, athlete_id)


@router.get("/export/csv")
async def export_csv(
    session: AsyncSession = Depends(get_session),
    _: None = Depends(require_admin),
) -> StreamingResponse:
    content = await report_service.export_csv(session)
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )
