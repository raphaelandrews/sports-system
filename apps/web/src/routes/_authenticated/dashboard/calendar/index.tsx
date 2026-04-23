import * as React from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarPlus2, Sparkles, Waves } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@sports-system/ui/components/badge";
import { Button, buttonVariants } from "@sports-system/ui/components/button";
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
import { cn } from "@sports-system/ui/lib/utils";

import { apiFetch, ApiError } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/date";
import { allEventsQueryOptions } from "@/queries/events";
import { queryKeys } from "@/queries/keys";
import { weekListQueryOptions } from "@/queries/weeks";
import type { EventStatus } from "@/types/events";
import type { WeekResponse } from "@/types/weeks";

export const Route = createFileRoute("/_authenticated/dashboard/calendar/")({
  ssr: false,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(weekListQueryOptions())
  },
  component: CalendarPage,
});

const statusLabel: Record<EventStatus, string> = {
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluido",
  CANCELLED: "Cancelado",
};

const phaseLabel: Record<string, string> = {
  GROUPS: "Grupos",
  QUARTER: "Quartas",
  SEMI: "Semis",
  FINAL: "Final",
  BRONZE: "Bronze",
};

function CalendarPage() {
  const { session } = Route.useRouteContext();
  const isAdmin = session.role === "ADMIN";
  const queryClient = useQueryClient();
  const { data: weeksData } = useSuspenseQuery(weekListQueryOptions());
  const weeks = orderWeeks(weeksData.data);
  const defaultWeekId = weeks[0]?.id;
  const [selectedWeekId, setSelectedWeekId] = useWeekSelection(defaultWeekId);

  const eventsQuery = useQuery({
    ...allEventsQueryOptions(
      selectedWeekId ? { per_page: 100, week_id: selectedWeekId } : { per_page: 100 },
    ),
    enabled: selectedWeekId != null,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedWeekId) {
        throw new Error("Selecione uma semana antes de gerar.");
      }
      return apiFetch(`/events/ai-generate?week_id=${selectedWeekId}`, {
        method: "POST",
      });
    },
    onSuccess: async () => {
      if (!selectedWeekId) {
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.events.all() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.byWeek(selectedWeekId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weeks.detail(selectedWeekId) }),
      ]);
      toast.success("Calendario gerado com IA.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao gerar calendario.");
    },
  });

  const events = eventsQuery.data?.data ?? [];
  const groupedEvents = groupEventsByDay(events);
  const activeWeek = weeks.find((week) => week.id === selectedWeekId);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_38%),linear-gradient(165deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.2))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Calendário</Badge>
              {activeWeek ? <Badge variant="secondary">Semana {activeWeek.week_number}</Badge> : null}
            </div>
            <CardTitle className="text-2xl">Calendário de eventos</CardTitle>
            <CardDescription className="max-w-2xl">
              Acompanhe os eventos agendados por semana e fase da competição.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <StatCard
              label="Semana ativa"
              value={activeWeek ? `#${activeWeek.week_number}` : "Sem semana"}
            />
            <StatCard label="Eventos visiveis" value={String(events.length)} />
            <StatCard
              label="Periodo"
              value={
                activeWeek
                  ? `${formatDate(activeWeek.start_date)} - ${formatDate(activeWeek.end_date)}`
                  : "—"
              }
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Controles</CardTitle>
            <CardDescription>
              {isAdmin ? "Semana, criacao manual e IA." : "Selecione a semana para visualizar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={selectedWeekId ? String(selectedWeekId) : undefined}
              onValueChange={(value) => setSelectedWeekId(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a semana" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week.id} value={String(week.id)}>
                    Semana {week.week_number} · {week.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isAdmin ? (
              <>
                <Link
                  to="/dashboard/calendar/events/new"
                  className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
                >
                  <CalendarPlus2 className="mr-2 size-4" />
                  Criar evento
                </Link>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={generateMutation.isPending || !selectedWeekId}
                  onClick={() => generateMutation.mutate()}
                >
                  <Sparkles className="mr-2 size-4" />
                  {generateMutation.isPending ? "Gerando..." : "Gerar Calendario com IA"}
                </Button>
              </>
            ) : null}

            {activeWeek ? (
              <Link
                to="/calendar/$weekId"
                params={{ weekId: String(activeWeek.id) }}
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
              >
                <Waves className="mr-2 size-4" />
                Ver calendario publico
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Grade da semana</CardTitle>
          <CardDescription>
            Eventos agrupados por data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {eventsQuery.isLoading ? (
            <div className="rounded-3xl border border-dashed border-border/70 p-8 text-sm text-muted-foreground">
              Carregando calendario...
            </div>
          ) : null}

          {!eventsQuery.isLoading && eventsQuery.error ? (
            <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {eventsQuery.error instanceof ApiError
                ? eventsQuery.error.message
                : "Falha ao carregar eventos."}
            </div>
          ) : null}

          {!eventsQuery.isLoading && !eventsQuery.error && events.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              Nenhum evento nesta semana.
            </div>
          ) : null}

          {Object.entries(groupedEvents).map(([day, dayEvents]) => (
            <section key={day} className="space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                    {formatDate(day)}
                  </div>
                  <div className="text-lg font-semibold">{dayEvents.length} evento(s)</div>
                </div>
              </div>

              <div className="grid gap-3">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-3 rounded-3xl border border-border/70 bg-muted/15 p-4 lg:grid-cols-[auto,1fr,auto]"
                  >
                    <div className="min-w-20 rounded-2xl bg-background px-3 py-2 text-center text-sm font-semibold">
                      {formatTime(event.start_time)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">Evento #{event.id}</span>
                        <Badge variant="outline">{phaseLabel[event.phase] ?? event.phase}</Badge>
                        <Badge variant={event.status === "IN_PROGRESS" ? "default" : "secondary"}>
                          {statusLabel[event.status]}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Modalidade #{event.modality_id}
                        {event.venue ? ` · ${event.venue}` : ""}
                      </div>
                    </div>
                    {isAdmin ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/dashboard/calendar/events/new"
                          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                        >
                          Duplicar base
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/75 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function groupEventsByDay<T extends { event_date: string; start_time: string }>(events: T[]) {
  return [...events]
    .sort((a, b) =>
      `${a.event_date}T${a.start_time}`.localeCompare(`${b.event_date}T${b.start_time}`),
    )
    .reduce<Record<string, T[]>>((acc, event) => {
      acc[event.event_date] ??= [];
      acc[event.event_date].push(event);
      return acc;
    }, {});
}

function orderWeeks(weeks: WeekResponse[]) {
  return [...weeks].sort((a, b) => b.week_number - a.week_number);
}

function useWeekSelection(defaultWeekId?: number) {
  const [selectedWeekId, setSelectedWeekId] = React.useState<number | undefined>(defaultWeekId);

  React.useEffect(() => {
    if (selectedWeekId == null && defaultWeekId != null) {
      setSelectedWeekId(defaultWeekId);
    }
  }, [defaultWeekId, selectedWeekId]);

  return [selectedWeekId, setSelectedWeekId] as const;
}
