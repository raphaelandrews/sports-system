import * as React from "react";
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@sports-system/ui/components/empty";

import { GroupStage } from "@/features/bracket/components/group-stage";
import { SingleElimination } from "@/features/bracket/components/single-elimination";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { allEventsQueryOptions, eventDetailQueryOptions } from "@/features/events/api/queries";
import { sportDetailQueryOptions } from "@/features/sports/api/queries";
import type {
  Match,
  MatchTeam,
  Team,
  Round,
  SingleEliminationBracket,
  GroupStageBracket,
  Group,
  GroupStanding,
} from "@/types/bracketcore";
import type { EventResponse, EventDetailResponse, MatchStatus } from "@/types/events";

export const Route = createFileRoute("/leagues/$leagueId/(public)/sports/$sportId/bracket")({
  loader: async ({ context: { queryClient }, params: { leagueId, sportId } }) => {
    const numericLeagueId = Number(leagueId);
    const numericSportId = Number(sportId);

    await Promise.all([
      queryClient.ensureQueryData(sportDetailQueryOptions(numericSportId)),
      queryClient.ensureQueryData(competitionListQueryOptions(numericLeagueId)),
      queryClient.ensureQueryData(delegationListQueryOptions(numericLeagueId)),
      queryClient.ensureQueryData(
        allEventsQueryOptions(numericLeagueId, { per_page: 200, sport_id: numericSportId }),
      ),
    ]);
  },
  component: SportBracketPage,
});

const ELIM_PHASES = ["QUARTER", "SEMI", "BRONZE", "FINAL"] as const;
type ElimPhase = (typeof ELIM_PHASES)[number];

const PHASE_LABEL: Record<string, string> = {
  QUARTER: "Quartas de final",
  SEMI: "Semifinal",
  BRONZE: "Disputa de bronze",
  FINAL: "Final",
};

function toMatchStatus(s: MatchStatus): "upcoming" | "live" | "completed" {
  if (s === "IN_PROGRESS") return "live";
  if (s === "COMPLETED") return "completed";
  return "upcoming";
}

function makeTeam(id: number | null, map: Map<number, { name: string }>): Team | null {
  if (id == null) return null;
  return { id: String(id), name: map.get(id)?.name ?? `Delegação #${id}` };
}

function makeMatchTeam(
  id: number | null,
  score: number | null,
  winnerId: number | null,
  map: Map<number, { name: string }>,
): MatchTeam {
  const isWinner = id != null && winnerId != null ? winnerId === id : undefined;
  return { team: makeTeam(id, map), score: score ?? 0, isWinner };
}

function buildSingleElimination(
  events: EventResponse[],
  details: (EventDetailResponse | undefined)[],
  delegationById: Map<number, { name: string }>,
): SingleEliminationBracket {
  const roundMap = new Map<ElimPhase, Round>();

  events.forEach((event, i) => {
    const phase = event.phase as ElimPhase;
    if (!ELIM_PHASES.includes(phase)) return;
    const detail = details[i];
    if (!detail || detail.matches.length === 0) return;

    if (!roundMap.has(phase)) {
      roundMap.set(phase, { name: PHASE_LABEL[phase] ?? phase, matches: [] });
    }
    const round = roundMap.get(phase)!;
    const roundIndex = ELIM_PHASES.indexOf(phase);

    detail.matches.forEach((match, pos) => {
      round.matches.push({
        id: String(match.id),
        round: roundIndex,
        position: pos,
        scheduledAt: event.event_date,
        status: toMatchStatus(match.status),
        teams: [
          makeMatchTeam(
            match.team_a_delegation_id,
            match.score_a,
            match.winner_delegation_id,
            delegationById,
          ),
          makeMatchTeam(
            match.team_b_delegation_id,
            match.score_b,
            match.winner_delegation_id,
            delegationById,
          ),
        ],
      });
    });
  });

  const rounds = ELIM_PHASES.filter((p) => roundMap.has(p)).map((p) => roundMap.get(p)!);
  return { type: "single-elimination", rounds };
}

function buildGroupFromEvent(
  event: EventResponse,
  detail: EventDetailResponse,
  groupIndex: number,
  delegationById: Map<number, { name: string }>,
): Group {
  const teamIds = new Set<number>();
  const matches: Match[] = [];

  detail.matches.forEach((match, pos) => {
    if (match.team_a_delegation_id) teamIds.add(match.team_a_delegation_id);
    if (match.team_b_delegation_id) teamIds.add(match.team_b_delegation_id);
    matches.push({
      id: String(match.id),
      round: 0,
      position: pos,
      scheduledAt: event.event_date,
      status: toMatchStatus(match.status),
      teams: [
        makeMatchTeam(
          match.team_a_delegation_id,
          match.score_a,
          match.winner_delegation_id,
          delegationById,
        ),
        makeMatchTeam(
          match.team_b_delegation_id,
          match.score_b,
          match.winner_delegation_id,
          delegationById,
        ),
      ],
    });
  });

  const standingMap = new Map<number, GroupStanding>();
  for (const id of teamIds) {
    standingMap.set(id, {
      team: { id: String(id), name: delegationById.get(id)?.name ?? `Delegação #${id}` },
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
      differential: 0,
    });
  }

  for (const match of detail.matches) {
    if (match.status !== "COMPLETED") continue;
    const aId = match.team_a_delegation_id;
    const bId = match.team_b_delegation_id;
    if (!aId || !bId) continue;

    const sa = match.score_a ?? 0;
    const sb = match.score_b ?? 0;
    const a = standingMap.get(aId)!;
    const b = standingMap.get(bId)!;

    a.differential += sa - sb;
    b.differential += sb - sa;

    if (sa > sb) {
      a.wins++;
      a.points += 3;
      b.losses++;
    } else if (sb > sa) {
      b.wins++;
      b.points += 3;
      a.losses++;
    } else {
      a.draws++;
      a.points++;
      b.draws++;
      b.points++;
    }
  }

  const standings = [...standingMap.values()].sort(
    (a, b) => b.points - a.points || b.differential - a.differential,
  );

  const name = event.venue
    ? `Grupo — ${event.venue}`
    : teamIds.size > 0
      ? `Grupo ${groupIndex + 1}`
      : `Grupo ${groupIndex + 1}`;

  return { name, teams: standings.map((s) => s.team), matches, standings };
}

function buildGroupStage(
  events: EventResponse[],
  details: (EventDetailResponse | undefined)[],
  delegationById: Map<number, { name: string }>,
): GroupStageBracket {
  const groups: Group[] = [];

  events.forEach((event, i) => {
    if (event.phase !== "GROUPS") return;
    const detail = details[i];
    if (!detail || detail.matches.length === 0) return;
    groups.push(buildGroupFromEvent(event, detail, groups.length, delegationById));
  });

  return { type: "group-stage", groups };
}

function SportBracketPage() {
  const { leagueId, sportId } = Route.useParams();
  const numericLeagueId = Number(leagueId);
  const numericSportId = Number(sportId);

  const { data: sport } = useSuspenseQuery(sportDetailQueryOptions(numericSportId));
  const { data: competitionsData } = useSuspenseQuery(competitionListQueryOptions(numericLeagueId));
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions(numericLeagueId));
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions(numericLeagueId, { per_page: 200, sport_id: numericSportId }),
  );

  const [selectedCompetitionId, setSelectedCompetitionId] = React.useState<string>(
    competitionsData.data[0] ? String(competitionsData.data[0].id) : "all",
  );

  const filteredEvents = eventsData.data.filter(
    (event) =>
      selectedCompetitionId === "all" || event.competition_id === Number(selectedCompetitionId),
  );

  const eventDetails = useSuspenseQueries({
    queries: filteredEvents.map((event) => eventDetailQueryOptions(numericLeagueId, event.id)),
  });

  const delegationById = new Map(delegationsData.data.map((d) => [d.id, d]));

  const modalityBrackets = sport.modalities.map((modality) => {
    const indices: number[] = [];
    filteredEvents.forEach((e, i) => {
      if (e.modality_id === modality.id) indices.push(i);
    });

    const mEvents = indices.map((i) => filteredEvents[i]!);
    const mDetails = indices.map((i) => eventDetails[i]?.data);

    const format = (modality.rules_json as { bracket_format?: string }).bracket_format;
    const hasGroups =
      format === "group-stage" || (!format && mEvents.some((e) => e.phase === "GROUPS"));
    const isDoubleElim = format === "double-elimination";
    const hasElim =
      format === "single-elimination" ||
      format === "double-elimination" ||
      (!format && mEvents.some((e) => ELIM_PHASES.includes(e.phase as ElimPhase)));

    return {
      modality,
      isDoubleElim,
      groupBracket: hasGroups ? buildGroupStage(mEvents, mDetails, delegationById) : null,
      elimBracket: hasElim ? buildSingleElimination(mEvents, mDetails, delegationById) : null,
    };
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_38%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Bracket</Badge>
              <Badge variant="secondary">{sport.sport_type}</Badge>
            </div>
            <CardTitle className="text-3xl">{sport.name}</CardTitle>
            {sport.description ? <CardDescription>{sport.description}</CardDescription> : null}
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <MiniStat label="Modalidades" value={String(sport.modalities.length)} />
            <MiniStat label="Eventos" value={String(filteredEvents.length)} />
            <MiniStat
              label="Fases"
              value={String(new Set(filteredEvents.map((e) => e.phase)).size)}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Filtro</CardTitle>
            <CardDescription>Visualize todas as competições ou uma específica.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedCompetitionId}
              onValueChange={(v) => setSelectedCompetitionId(v ?? "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as competições" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as competições</SelectItem>
                {competitionsData.data.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    Competição {c.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </section>

      {modalityBrackets.map(({ modality, isDoubleElim, groupBracket, elimBracket }) => (
        <section key={modality.id} className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold">{modality.name}</h2>
            <Badge variant="outline">{modality.gender}</Badge>
            {modality.category ? <Badge variant="secondary">{modality.category}</Badge> : null}
          </div>

          {!groupBracket && !elimBracket && (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhuma chave gerada</EmptyTitle>
                <EmptyDescription>
                  As chaves ainda não foram geradas para esta modalidade.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {groupBracket && (
            <Card className="border border-border/70 overflow-hidden">
              <CardHeader className="border-b border-border/70">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Fase de grupos</CardTitle>
                  <Badge variant="secondary">{groupBracket.groups.length} grupo(s)</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <GroupStage bracket={groupBracket} />
                </div>
              </CardContent>
            </Card>
          )}

          {elimBracket && (
            <Card className="border border-border/70 overflow-hidden">
              <CardHeader className="border-b border-border/70">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Fase eliminatória</CardTitle>
                  <Badge variant="secondary">{elimBracket.rounds.length} rodada(s)</Badge>
                  {isDoubleElim && <Badge variant="outline">Eliminatória Dupla</Badge>}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <SingleElimination bracket={elimBracket} />
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
