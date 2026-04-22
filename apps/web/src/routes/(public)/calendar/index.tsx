import { Badge } from "@sports-system/ui/components/badge";
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
import { useState } from "react";

import { formatDate, formatTime } from "@/lib/date";
import { allEventsQueryOptions } from "@/queries/events";
import { weekListQueryOptions } from "@/queries/weeks";
import type { EventStatus } from "@/types/events";

export const Route = createFileRoute("/(public)/calendar/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(weekListQueryOptions()),
      queryClient.ensureQueryData(allEventsQueryOptions({ per_page: 100 })),
    ]),
  component: CalendarPage,
});

const statusVariant: Record<
  EventStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
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
  const { data: weeksData } = useSuspenseQuery(weekListQueryOptions());
  const weeks = weeksData.data;

  const [selectedWeekId, setSelectedWeekId] = useState<string>("all");

  const params =
    selectedWeekId !== "all"
      ? { per_page: 100, week_id: Number(selectedWeekId) }
      : { per_page: 100 };

  const { data: eventsData } = useSuspenseQuery(allEventsQueryOptions(params));
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
        <Select value={selectedWeekId} onValueChange={(v) => setSelectedWeekId(v ?? "all")}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as semanas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as semanas</SelectItem>
            {weeks.map((w) => (
              <SelectItem key={w.id} value={String(w.id)}>
                Semana {w.week_number}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sortedDays.length === 0 && (
        <p className="text-muted-foreground text-center py-12">
          Nenhum evento encontrado.
        </p>
      )}

      <div className="space-y-8">
        {sortedDays.map((day) => (
          <div key={day}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-medium">{formatDate(day)}</h2>
              {selectedWeekId !== "all" ? (
                <Link
                  to="/calendar/$weekId"
                  params={{ weekId: selectedWeekId }}
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Ver semana
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
                      <Badge variant={statusVariant[ev.status]}>
                        {statusLabel[ev.status]}
                      </Badge>
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
