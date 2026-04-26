import { Badge } from "@sports-system/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sports-system/ui/components/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { formatDate, formatTime } from "@/shared/lib/date";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { EventStatus } from "@/types/events";

export const Route = createFileRoute("/leagues/$leagueId/(public)/calendar/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(allEventsQueryOptions(Number(leagueId), { per_page: 100 })),
    ]),
  component: CalendarPage,
});

const statusVariant: Record<EventStatus, "default" | "secondary" | "outline" | "destructive"> = {
  SCHEDULED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
};

const statusLabel: Record<EventStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

function CalendarPage() {
  const { leagueId } = Route.useParams();
  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const competitions = competitionsData.data;
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("all");

  const params =
    selectedCompetitionId !== "all"
      ? { per_page: 100, competition_id: Number(selectedCompetitionId) }
      : { per_page: 100 };

  const { data: eventsData } = useSuspenseQuery(allEventsQueryOptions(Number(leagueId), params));
  const events = eventsData.data;

  const grouped = events.reduce<Record<string, typeof events>>((acc, ev) => {
    const day = ev.event_date;
    (acc[day] ??= []).push(ev);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Calendário</h1>
        <Select
          value={selectedCompetitionId}
          onValueChange={(value) => setSelectedCompetitionId(value ?? "all")}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as competicoes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as competicoes</SelectItem>
            {competitions.map((competition) => (
              <SelectItem key={competition.id} value={String(competition.id)}>
                Competicao {competition.number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sortedDays.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>Nenhum evento encontrado</EmptyTitle>
            <EmptyDescription>Ainda não há eventos agendados para esta liga.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="space-y-8">
        {sortedDays.map((day) => (
          <div key={day}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">{formatDate(day)}</h2>
              {selectedCompetitionId !== "all" ? (
                <Link
                  to="/leagues/$leagueId/competitions/$competitionId"
                  params={{ leagueId, competitionId: selectedCompetitionId }}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Ver competicao
                </Link>
              ) : null}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped[day].map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{formatTime(ev.start_time)}</TableCell>
                    <TableCell>{ev.venue ?? "—"}</TableCell>
                    <TableCell>{ev.phase}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[ev.status]}>{statusLabel[ev.status]}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </div>
    </div>
  );
}
