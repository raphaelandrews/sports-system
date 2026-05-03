import { Badge } from "@sports-system/ui/components/badge";
import { Card, CardContent, CardHeader } from "@sports-system/ui/components/card";
import { Skeleton } from "@sports-system/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sports-system/ui/components/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import * as m from "@/paraglide/messages";
import { formatDate, formatTime } from "@/shared/lib/date";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import {
  competitionEventsQueryOptions,
  eventDetailQueryOptions,
} from "@/features/events/api/queries";
import { competitionReportQueryOptions } from "@/features/competitions/api/queries";
import type { DelegationSummary } from "@/types/delegations";
import type { EventResponse, EventStatus, MatchResponse } from "@/types/events";

export const Route = createFileRoute("/leagues/$leagueId/(public)/competitions/$competitionId")({
  loader: async ({ context: { queryClient }, params: { leagueId, competitionId } }) => {
    const numericLeagueId = Number(leagueId);
    const id = Number(competitionId);
    await Promise.all([
      queryClient.ensureQueryData(competitionReportQueryOptions(numericLeagueId, id)),
      queryClient.ensureQueryData(competitionEventsQueryOptions(numericLeagueId, id)),
      queryClient.ensureQueryData(delegationListQueryOptions(numericLeagueId)),
    ]);
  },
  component: CompetitionDetailPage,
});

const phaseLabel: Record<string, string> = {
  GROUPS: m['common.phase.group'](),
  QUARTER: "Quarter",
  SEMI: "Semi",
  FINAL: m['common.phase.final'](),
  BRONZE: "Bronze",
};

const eventStatusVariant: Record<EventStatus, "default" | "secondary" | "outline" | "destructive"> =
  {
    SCHEDULED: "secondary",
    IN_PROGRESS: "default",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  };

const eventStatusLabel: Record<EventStatus, string> = {
  SCHEDULED: m['common.status.scheduled'](),
  IN_PROGRESS: m['common.status.live'](),
  COMPLETED: m['common.status.completed'](),
  CANCELLED: m['common.status.cancelled'](),
};

function CompetitionDetailPage() {
  const { competitionId, leagueId } = Route.useParams();
  const numericLeagueId = Number(leagueId);
  const id = Number(competitionId);

  const { data: report } = useSuspenseQuery(competitionReportQueryOptions(numericLeagueId, id));
  const { data: eventsData } = useSuspenseQuery(competitionEventsQueryOptions(numericLeagueId, id));
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions(numericLeagueId));

  const delegationById = new Map<number, DelegationSummary>(
    delegationsData.data.map((d) => [d.id, d]),
  );

  const eventsByDate = eventsData.data.reduce<Record<string, EventResponse[]>>((acc, event) => {
    const key = event.event_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  const sortedDates = Object.keys(eventsByDate).sort();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-1">
        <Link
          to="/leagues/$leagueId/competitions"
          params={{ leagueId }}
          className="text-muted-foreground text-sm hover:underline"
        >
          ← {m['competitions.public.title']()}
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{m['competition.admin.badge.competition']({ "competition.number": report.number })}</h1>
        <Badge variant={report.status === "ACTIVE" ? "default" : "secondary"}>
          {report.status}
        </Badge>
        <span className="text-muted-foreground text-sm">
          {formatDate(report.start_date)} – {formatDate(report.end_date)}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <SummaryCard label={m['competition.detail.stat.events']()} value={report.summary.total_events} />
        <SummaryCard label={m['competition.detail.stat.completed']()} value={report.summary.completed_matches} />
        <SummaryCard label={m['competition.detail.stat.matches']()} value={report.summary.total_matches} />
      </div>

      <Tabs defaultValue="medals">
        <TabsList>
          <TabsTrigger value="medals">{m['competition.detail.tab.medals']()}</TabsTrigger>
          <TabsTrigger value="events">{m['competition.detail.tab.events']()}</TabsTrigger>
        </TabsList>

        <TabsContent value="medals" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{m['competition.detail.table.rank']()}</TableHead>
                <TableHead>{m['competition.detail.table.delegation']()}</TableHead>
                <TableHead className="text-center">🥇</TableHead>
                <TableHead className="text-center">🥈</TableHead>
                <TableHead className="text-center">🥉</TableHead>
                <TableHead className="text-center">{m['competition.detail.table.total']()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.medal_board.map((entry, i) => (
                <TableRow key={entry.delegation_id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{entry.delegation_code}</span>{" "}
                    {entry.delegation_name}
                  </TableCell>
                  <TableCell className="text-center">{entry.gold}</TableCell>
                  <TableCell className="text-center">{entry.silver}</TableCell>
                  <TableCell className="text-center">{entry.bronze}</TableCell>
                  <TableCell className="text-center font-medium">{entry.total}</TableCell>
                </TableRow>
              ))}
              {report.medal_board.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground text-center">
                    {m['competition.detail.empty.medals']()}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="events" className="mt-4 space-y-6">
          {sortedDates.length === 0 && (
            <p className="text-muted-foreground text-sm">{m['competition.detail.empty.events']()}</p>
          )}
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-medium">{formatDate(date)}</h3>
              <div className="space-y-2">
                {eventsByDate[date].map((event) => (
                  <EventCard key={event.id} event={event} delegationById={delegationById} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-1 text-sm font-medium">{label}</CardHeader>
      <CardContent className="text-2xl font-bold">{value}</CardContent>
    </Card>
  );
}

function EventCard({
  event,
  delegationById,
}: {
  event: EventResponse;
  delegationById: Map<number, DelegationSummary>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <Badge variant="outline">{phaseLabel[event.phase] ?? event.phase}</Badge>
        {event.venue && <span className="text-muted-foreground text-sm">{event.venue}</span>}
        <span className="text-muted-foreground text-sm">{formatTime(event.start_time)}</span>
        <Badge variant={eventStatusVariant[event.status]} className="ml-auto">
          {eventStatusLabel[event.status]}
        </Badge>
        <span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <CardContent className="border-t pt-3">
          <Suspense fallback={<Skeleton className="h-20 w-full" />}>
            <EventMatches eventId={event.id} delegationById={delegationById} />
          </Suspense>
        </CardContent>
      )}
    </Card>
  );
}

function EventMatches({
  eventId,
  delegationById,
}: {
  eventId: number;
  delegationById: Map<number, DelegationSummary>;
}) {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(eventDetailQueryOptions(Number(leagueId), eventId));

  if (data.matches.length === 0) {
    return <p className="text-muted-foreground text-sm">{m['competition.detail.empty.matches']()}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{m['competition.detail.table.teamA']()}</TableHead>
          <TableHead className="text-center">{m['competition.detail.table.score']()}</TableHead>
          <TableHead className="text-right">{m['competition.detail.table.teamB']()}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.matches.map((match) => (
          <MatchRow key={match.id} match={match} delegationById={delegationById} />
        ))}
      </TableBody>
    </Table>
  );
}

function MatchRow({
  match,
  delegationById,
}: {
  match: MatchResponse;
  delegationById: Map<number, DelegationSummary>;
}) {
  const teamA = match.team_a_delegation_id ? delegationById.get(match.team_a_delegation_id) : null;
  const teamB = match.team_b_delegation_id ? delegationById.get(match.team_b_delegation_id) : null;

  const aWon = match.winner_delegation_id === match.team_a_delegation_id;
  const bWon = match.winner_delegation_id === match.team_b_delegation_id;

  return (
    <TableRow>
      <TableCell className={aWon ? "font-bold" : ""}>
        {teamA ? (
          <>
            <span className="font-mono text-xs">{teamA.code}</span> {teamA.name}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-center font-mono">
        {match.score_a != null && match.score_b != null
          ? `${match.score_a} × ${match.score_b}`
          : "–"}
      </TableCell>
      <TableCell className={`text-right ${bWon ? "font-bold" : ""}`}>
        {teamB ? (
          <>
            {teamB.name} <span className="font-mono text-xs">{teamB.code}</span>
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}
