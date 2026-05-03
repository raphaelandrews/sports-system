import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Badge } from "@sports-system/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { buttonVariants } from "@sports-system/ui/components/button";
import { cn } from "@sports-system/ui/lib/utils";

import * as m from "@/paraglide/messages";
import { formatDate, formatTime } from "@/shared/lib/date";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import {
  competitionEventsQueryOptions,
  eventDetailQueryOptions,
} from "@/features/events/api/queries";
import { competitionDetailQueryOptions } from "@/features/competitions/api/queries";
import type { EventDetailResponse, EventResponse, EventStatus } from "@/types/events";

export const Route = createFileRoute("/leagues/$leagueId/(public)/calendar/$competitionId/")({
  loader: async ({ context: { queryClient }, params: { leagueId, competitionId } }) => {
    const numericCompetitionId = Number(competitionId);
    const numericLeagueId = Number(leagueId);

    await Promise.all([
      queryClient.ensureQueryData(
        competitionDetailQueryOptions(numericLeagueId, numericCompetitionId),
      ),
      queryClient.ensureQueryData(
        competitionEventsQueryOptions(numericLeagueId, numericCompetitionId),
      ),
      queryClient.ensureQueryData(delegationListQueryOptions(numericLeagueId)),
    ]);
  },
  component: PublicCompetitionCalendarPage,
});

const statusVariant: Record<EventStatus, "default" | "secondary" | "outline" | "destructive"> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

const phaseLabel: Record<string, string> = {
  GROUPS: m['common.phase.group'](),
  QUARTER: "Quarter",
  SEMI: "Semi",
  FINAL: m['common.phase.final'](),
  BRONZE: "Bronze",
};

function PublicCompetitionCalendarPage() {
  const { competitionId, leagueId } = Route.useParams();
  const numericCompetitionId = Number(competitionId);
  const numericLeagueId = Number(leagueId);
  const { data: competition } = useSuspenseQuery(
    competitionDetailQueryOptions(numericLeagueId, numericCompetitionId),
  );
  const { data: eventsData } = useSuspenseQuery(
    competitionEventsQueryOptions(numericLeagueId, numericCompetitionId),
  );
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions(numericLeagueId));
  const eventDetails = useSuspenseQueries({
    queries: eventsData.data.map((event) => eventDetailQueryOptions(numericLeagueId, event.id)),
  });
  const delegationById = new Map(
    delegationsData.data.map((delegation) => [delegation.id, delegation]),
  );

  const groupedDays = eventsData.data
    .map((event, index) => ({ event, detail: eventDetails[index].data }))
    .sort((a, b) =>
      `${a.event.event_date}T${a.event.start_time}`.localeCompare(
        `${b.event.event_date}T${b.event.start_time}`,
      ),
    )
    .reduce<Record<string, Array<{ event: EventResponse; detail: EventDetailResponse }>>>(
      (acc, item) => {
        acc[item.event.event_date] ??= [];
        acc[item.event.event_date].push(item);
        return acc;
      },
      {},
    );

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_38%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{m['calendar.competition.badge.official']()}</Badge>
              <Badge variant="secondary">{competition.status}</Badge>
            </div>
            <CardTitle className="text-3xl">{m['calendar.competition.card.title']({ "competition.number": competition.number })}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickPill
              label={m['calendar.competition.stat.period']()}
              value={`${formatDate(competition.start_date)} - ${formatDate(competition.end_date)}`}
            />
            <QuickPill label={m['calendar.competition.stat.events']()} value={String(eventsData.data.length)} />
            <QuickPill
              label={m['calendar.competition.stat.status']()}
              value={competition.status === "ACTIVE" ? "Em disputa" : competition.status}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m['calendar.competition.card.navTitle']()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/leagues/$leagueId/calendar"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              {m['common.actions.back']()}
            </Link>
            <Link
              to="/leagues/$leagueId/competitions/$competitionId"
              params={{ leagueId, competitionId }}
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}
            >
              {m['common.actions.view']()}
            </Link>
          </CardContent>
        </Card>
      </section>

      <div className="space-y-8">
        {Object.entries(groupedDays).map(([day, items]) => (
          <section key={day} className="space-y-4">
            <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-3">
              <div>
                <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Agenda
                </div>
                <h2 className="text-2xl font-semibold">{formatDate(day)}</h2>
              </div>
              <div className="text-sm text-muted-foreground">{items.length} evento(s)</div>
            </div>

            <div className="grid gap-4">
              {items.map(({ event, detail }) => (
                <Card key={event.id} className="border border-border/70">
                  <CardContent className="grid gap-4 p-5 lg:grid-cols-[auto,1fr,auto]">
                    <div className="rounded-3xl bg-muted/40 px-4 py-3 text-center">
                      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                        Horario
                      </div>
                      <div className="mt-2 text-lg font-semibold">
                        {formatTime(event.start_time)}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{phaseLabel[event.phase] ?? event.phase}</Badge>
                        <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
                        {event.venue ? (
                          <span className="text-sm text-muted-foreground">{event.venue}</span>
                        ) : null}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {detail.matches.length > 0 ? (
                          detail.matches.map((match) => (
                            <div
                              key={match.id}
                              className="rounded-3xl border border-border/60 bg-muted/15 p-4"
                            >
                              <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                                Partida #{match.id}
                              </div>
                              <div className="mt-3 space-y-2">
                                <div>
                                  {labelDelegation(
                                    match.team_a_delegation_id,
                                    delegationById,
                                    "Lado A",
                                  )}
                                </div>
                                <div>
                                  {labelDelegation(
                                    match.team_b_delegation_id,
                                    delegationById,
                                    "Lado B",
                                  )}
                                </div>
                              </div>
                              <div className="mt-4 rounded-2xl bg-background px-3 py-2 text-sm font-semibold">
                                {match.score_a != null && match.score_b != null
                                  ? `${match.score_a} x ${match.score_b}`
                                  : "Sem placar"}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-3xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                            {m['calendar.competition.empty.matches']()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        to="/leagues/$leagueId/competitions/$competitionId"
                        params={{ leagueId, competitionId }}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "justify-start",
                        )}
                      >
                        <ArrowRight className="mr-2 size-4" />
                        {m['common.actions.view']()}
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function QuickPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-semibold">{value}</div>
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
