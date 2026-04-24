import csv
import io
import zipfile
from datetime import date
from xml.sax.saxutils import escape

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.athlete import Athlete
from app.models.athlete import AthleteModality
from app.models.delegation import Delegation
from app.models.event import Event, Match, MatchStatus
from app.models.result import AthleteStatistic, Result
from app.models.sport import Modality, Sport
from app.models.competition import Competition
from app.repositories import athlete_repository, result_repository
from app.schemas.athlete import AthleteResponse, DelegationHistoryItem, MatchHistoryItem
from app.schemas.report import (
    AthleteReportResponse,
    CompetitionPeriodSummary,
    CompetitionReportResponse,
    CompetitionSummary,
    FinalReportResponse,
)
from app.schemas.result import MedalBoardEntry, ResultResponse
from app.services import result_service


async def get_final_report(session: AsyncSession) -> FinalReportResponse:
    medal_board = await result_service.get_medal_board(session)
    records = await result_service.get_records(session)

    total_delegations = (await session.execute(select(func.count()).select_from(Delegation).where(Delegation.is_active == True))).scalar_one()  # noqa: E712
    total_athletes = (await session.execute(select(func.count()).select_from(Athlete).where(Athlete.is_active == True))).scalar_one()  # noqa: E712
    total_competitions = (await session.execute(select(func.count()).select_from(Competition))).scalar_one()
    total_events = (await session.execute(select(func.count()).select_from(Event))).scalar_one()
    total_matches = (await session.execute(select(func.count()).select_from(Match))).scalar_one()
    completed_matches = (await session.execute(select(func.count()).select_from(Match).where(Match.status == MatchStatus.COMPLETED))).scalar_one()
    athletes_by_sport_result = await session.execute(
        select(
            Sport.id,
            Sport.name,
            func.count(func.distinct(AthleteModality.athlete_id)).label("athlete_count"),
        )
        .select_from(Sport)
        .join(Modality, Modality.sport_id == Sport.id, isouter=True)
        .join(AthleteModality, AthleteModality.modality_id == Modality.id, isouter=True)
        .where(Sport.is_active == True)  # noqa: E712
        .group_by(Sport.id, Sport.name)
        .order_by(func.count(func.distinct(AthleteModality.athlete_id)).desc(), Sport.name)
    )

    return FinalReportResponse(
        medal_board=medal_board,
        records=records,
        summary=CompetitionSummary(
            total_delegations=total_delegations,
            total_athletes=total_athletes,
            total_competitions=total_competitions,
            total_events=total_events,
            total_matches=total_matches,
            completed_matches=completed_matches,
        ),
        athletes_by_sport=[
            {"sport_id": sport_id, "sport_name": sport_name, "athlete_count": athlete_count}
            for sport_id, sport_name, athlete_count in athletes_by_sport_result.all()
        ],
    )


async def get_competition_report(session: AsyncSession, competition_id: int) -> CompetitionReportResponse:
    competition = await session.get(Competition, competition_id)
    if competition is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Competition not found")

    total_events = (await session.execute(select(func.count()).select_from(Event).where(Event.competition_id == competition_id))).scalar_one()
    total_matches_q = (
        select(func.count()).select_from(Match)
        .join(Event, Event.id == Match.event_id)
        .where(Event.competition_id == competition_id)
    )
    total_matches = (await session.execute(total_matches_q)).scalar_one()
    completed_matches = (await session.execute(
        select(func.count()).select_from(Match)
        .join(Event, Event.id == Match.event_id)
        .where(Event.competition_id == competition_id, Match.status == MatchStatus.COMPLETED)
    )).scalar_one()

    from app.models.result import Medal
    gold = func.count().filter(Result.medal == Medal.GOLD)
    silver = func.count().filter(Result.medal == Medal.SILVER)
    bronze = func.count().filter(Result.medal == Medal.BRONZE)
    board_result = await session.execute(
        select(Result.delegation_id, gold.label("gold"), silver.label("silver"), bronze.label("bronze"))
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .where(Event.competition_id == competition_id, Result.delegation_id.is_not(None), Result.medal.is_not(None))
        .group_by(Result.delegation_id)
        .order_by(gold.desc(), silver.desc(), bronze.desc())
    )
    medal_board: list[MedalBoardEntry] = []
    for row in board_result.all():
        d = await session.get(Delegation, row.delegation_id)
        if d:
            medal_board.append(MedalBoardEntry(
                delegation_id=row.delegation_id,
                delegation_name=d.name,
                delegation_code=d.code,
                gold=row.gold,
                silver=row.silver,
                bronze=row.bronze,
                total=row.gold + row.silver + row.bronze,
            ))

    return CompetitionReportResponse(
        competition_id=competition.id,
        number=competition.number,
        status=competition.status.value,
        start_date=competition.start_date,
        end_date=competition.end_date,
        medal_board=medal_board,
        summary=CompetitionPeriodSummary(
            total_events=total_events,
            total_matches=total_matches,
            completed_matches=completed_matches,
        ),
    )


async def get_athlete_report(session: AsyncSession, athlete_id: int) -> AthleteReportResponse:
    athlete = await athlete_repository.get_by_id(session, athlete_id)
    if athlete is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Athlete not found")

    del_history = await athlete_repository.get_delegation_history(session, athlete)
    match_history = await athlete_repository.get_match_history(session, athlete_id)

    medals_result = await session.execute(
        select(Result).where(Result.athlete_id == athlete_id, Result.medal.is_not(None))
    )
    medals = medals_result.scalars().all()

    stats_result = await session.execute(
        select(AthleteStatistic).where(AthleteStatistic.athlete_id == athlete_id)
    )
    raw_stats = stats_result.scalars().all()
    statistics = {f"sport_{s.sport_id}_competition_{s.competition_id}": s.stats_json for s in raw_stats}

    return AthleteReportResponse(
        athlete=AthleteResponse.model_validate(athlete),
        delegation_history=[DelegationHistoryItem(**d) for d in del_history],
        match_history=[MatchHistoryItem(**m) for m in match_history],
        medals=[ResultResponse.model_validate(r) for r in medals],
        statistics=statistics,
    )


async def export_csv(session: AsyncSession) -> str:
    rows_result = await session.execute(
        select(Result, Match, Event, Modality, Sport, Delegation)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .join(Delegation, Delegation.id == Result.delegation_id)
        .where(Result.delegation_id.is_not(None))
        .order_by(Event.event_date.desc(), Result.rank)
    )
    rows = rows_result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["match_id", "event_date", "sport", "modality", "delegation", "rank", "medal", "score"])
    for r, m, e, mod, sp, d in rows:
        score = r.value_json.get("score", "") if r.value_json else ""
        writer.writerow([
            m.id,
            e.event_date.isoformat(),
            sp.name,
            mod.name,
            d.name,
            r.rank,
            r.medal.value if r.medal else "",
            score,
        ])
    return output.getvalue()


async def export_xlsx(session: AsyncSession) -> bytes:
    rows_result = await session.execute(
        select(Result, Match, Event, Modality, Sport, Delegation)
        .join(Match, Match.id == Result.match_id)
        .join(Event, Event.id == Match.event_id)
        .join(Modality, Modality.id == Event.modality_id)
        .join(Sport, Sport.id == Modality.sport_id)
        .join(Delegation, Delegation.id == Result.delegation_id)
        .where(Result.delegation_id.is_not(None))
        .order_by(Event.event_date.desc(), Result.rank)
    )
    rows = rows_result.all()

    sheet_rows: list[list[str]] = [[
        "match_id",
        "event_date",
        "sport",
        "modality",
        "delegation",
        "rank",
        "medal",
        "score",
    ]]

    for r, m, e, mod, sp, d in rows:
        score = r.value_json.get("score", "") if r.value_json else ""
        sheet_rows.append([
            str(m.id),
            e.event_date.isoformat(),
            sp.name,
            mod.name,
            d.name,
            str(r.rank),
            r.medal.value if r.medal else "",
            str(score),
        ])

    workbook = io.BytesIO()
    with zipfile.ZipFile(workbook, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>""",
        )
        archive.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>""",
        )
        archive.writestr(
            "docProps/core.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <dc:title>Sports System Results Export</dc:title>
  <dc:creator>sports-system</dc:creator>
</cp:coreProperties>""",
        )
        archive.writestr(
            "docProps/app.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">
  <Application>sports-system</Application>
</Properties>""",
        )
        archive.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Results" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>""",
        )
        archive.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>""",
        )
        archive.writestr(
            "xl/styles.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>""",
        )
        archive.writestr("xl/worksheets/sheet1.xml", _build_xlsx_sheet(sheet_rows))

    return workbook.getvalue()


def _build_xlsx_sheet(rows: list[list[str]]) -> str:
    dimension = f"A1:H{max(len(rows), 1)}"
    xml_rows: list[str] = []

    for row_index, row in enumerate(rows, start=1):
        cells = []
        for col_index, value in enumerate(row, start=1):
            cell_ref = f"{_column_name(col_index)}{row_index}"
            cells.append(
                f'<c r="{cell_ref}" t="inlineStr"><is><t>{escape(value)}</t></is></c>'
            )
        xml_rows.append(f'<row r="{row_index}">{"".join(cells)}</row>')

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="{dimension}"/>
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <sheetData>{''.join(xml_rows)}</sheetData>
</worksheet>"""


def _column_name(index: int) -> str:
    label = ""
    current = index
    while current > 0:
        current, remainder = divmod(current - 1, 26)
        label = chr(65 + remainder) + label
    return label
