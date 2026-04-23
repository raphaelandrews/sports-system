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

import { BracketView, type BracketRound } from "@/components/matches/bracket-view";
import { delegationListQueryOptions } from "@/queries/delegations";
import { allEventsQueryOptions, eventDetailQueryOptions } from "@/queries/events";
import { sportDetailQueryOptions } from "@/queries/sports";
import { weekListQueryOptions } from "@/queries/weeks";

export const Route = createFileRoute("/(public)/sports/$sportId/bracket")({
  loader: async ({ context: { queryClient }, params }) => {
    const sportId = Number(params.sportId);

    await Promise.all([
      queryClient.ensureQueryData(sportDetailQueryOptions(sportId)),
      queryClient.ensureQueryData(weekListQueryOptions()),
      queryClient.ensureQueryData(delegationListQueryOptions()),
      queryClient.ensureQueryData(allEventsQueryOptions({ per_page: 200, sport_id: sportId })),
    ]);
  },
  component: SportBracketPage,
});

const phaseOrder = ["GROUPS", "QUARTER", "SEMI", "BRONZE", "FINAL"] as const;

const phaseLabel: Record<(typeof phaseOrder)[number], string> = {
  GROUPS: "Grupos",
  QUARTER: "Quartas",
  SEMI: "Semis",
  BRONZE: "Bronze",
  FINAL: "Final",
};

function SportBracketPage() {
  const { sportId } = Route.useParams();
  const numericSportId = Number(sportId);
  const { data: sport } = useSuspenseQuery(sportDetailQueryOptions(numericSportId));
  const { data: weeksData } = useSuspenseQuery(weekListQueryOptions());
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions());
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions({ per_page: 200, sport_id: numericSportId }),
  );
  const [selectedWeekId, setSelectedWeekId] = React.useState<string>(
    weeksData.data[0] ? String(weeksData.data[0].id) : "all",
  );

  const filteredEvents = eventsData.data.filter(
    (event) => selectedWeekId === "all" || event.week_id === Number(selectedWeekId),
  );

  const eventDetails = useSuspenseQueries({
    queries: filteredEvents.map((event) => eventDetailQueryOptions(event.id)),
  });

  const modalityById = new Map(sport.modalities.map((modality) => [modality.id, modality]));
  const delegationById = new Map(delegationsData.data.map((delegation) => [delegation.id, delegation]));
  const roundsByModality = filteredEvents.reduce<Record<number, BracketRound[]>>((acc, event, index) => {
    const detail = eventDetails[index].data;
    const modality = modalityById.get(event.modality_id);

    if (!modality || detail.matches.length === 0) {
      return acc;
    }

    const modalityRounds = acc[event.modality_id] ?? [];
    const round = modalityRounds.find((item) => item.id === event.phase);
    const nextRound: BracketRound = round ?? {
      id: event.phase,
      title: phaseLabel[event.phase as keyof typeof phaseLabel] ?? event.phase,
      matches: [],
    };

    nextRound.matches.push(
      ...detail.matches.map((match) => ({
        id: `${match.id}`,
        label: `Partida #${match.id}`,
        teamA: labelDelegation(match.team_a_delegation_id, delegationById, "Lado A"),
        teamB: labelDelegation(match.team_b_delegation_id, delegationById, "Lado B"),
        score:
          match.score_a != null && match.score_b != null
            ? `${match.score_a} x ${match.score_b}`
            : undefined,
        status: match.status,
      })),
    );

    if (!round) {
      modalityRounds.push(nextRound);
    }

    acc[event.modality_id] = modalityRounds;
    return acc;
  }, {});

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
            <MiniStat label="Fases" value={String(new Set(filteredEvents.map((event) => event.phase)).size)} />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Filtro</CardTitle>
            <CardDescription>Visualize todas as semanas ou uma semana especifica.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedWeekId}
              onValueChange={(value) => setSelectedWeekId(value ?? "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as semanas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as semanas</SelectItem>
                {weeksData.data.map((week) => (
                  <SelectItem key={week.id} value={String(week.id)}>
                    Semana {week.week_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </section>

      {sport.modalities.map((modality) => {
        const rounds = [...(roundsByModality[modality.id] ?? [])].sort(
          (a, b) => phaseOrder.indexOf(a.id as (typeof phaseOrder)[number]) - phaseOrder.indexOf(b.id as (typeof phaseOrder)[number]),
        );

        return (
          <section key={modality.id} className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">{modality.name}</h2>
                <Badge variant="outline">{modality.gender}</Badge>
                {modality.category ? <Badge variant="secondary">{modality.category}</Badge> : null}
              </div>
            </div>
            <BracketView
              rounds={rounds}
              emptyLabel="Nenhuma chave gerada ainda para esta modalidade."
            />
          </section>
        );
      })}
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

function labelDelegation(
  delegationId: number | null | undefined,
  delegationById: Map<number, { name: string }>,
  fallback: string,
) {
  if (!delegationId) {
    return fallback;
  }

  return delegationById.get(delegationId)?.name ?? `Delegacao #${delegationId}`;
}
