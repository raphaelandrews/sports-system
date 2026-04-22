import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { cn } from "@sports-system/ui/lib/utils";

import { apiFetch, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/date";
import { weekEventsQueryOptions } from "@/queries/events";
import { queryKeys } from "@/queries/keys";
import { sportListQueryOptions } from "@/queries/sports";
import {
  weekDetailQueryOptions,
  weekSchedulePreviewQueryOptions,
} from "@/queries/weeks";
import type { WeekResponse, WeekStatus } from "@/types/weeks";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_admin/weeks/$weekId/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params }) => {
    const weekId = Number(params.weekId);
    void queryClient.prefetchQuery(weekDetailQueryOptions(weekId))
    void queryClient.prefetchQuery(weekEventsQueryOptions(weekId))
    void queryClient.prefetchQuery(sportListQueryOptions())
    void queryClient.prefetchQuery(weekSchedulePreviewQueryOptions(weekId))
  },
  component: WeekDetailPage,
});

const statusLabel: Record<WeekStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  LOCKED: "Travada",
  ACTIVE: "Ativa",
  COMPLETED: "Encerrada",
};

function WeekDetailPage() {
  const queryClient = useQueryClient();
  const { weekId } = Route.useParams();
  const weekNumber = Number(weekId);
  const { data: week } = useSuspenseQuery(weekDetailQueryOptions(weekNumber));
  const { data: events } = useSuspenseQuery(weekEventsQueryOptions(weekNumber));
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());
  const { data: preview } = useSuspenseQuery(weekSchedulePreviewQueryOptions(weekNumber));

  const refreshWeek = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.weeks.detail(weekNumber) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.weeks.all() }),
      queryClient.invalidateQueries({ queryKey: [...queryKeys.weeks.detail(weekNumber), "schedule-preview"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.events.byWeek(weekNumber) }),
    ]);
  };

  const transitionMutation = useMutation({
    mutationFn: async (action: "publish" | "lock" | "activate" | "complete") =>
      apiFetch<WeekResponse>(`/weeks/${weekNumber}/${action}`, {
        method: "POST",
      }),
    onSuccess: async (_, action) => {
      await refreshWeek();
      toast.success(`Semana ${transitionVerb[action]} com sucesso.`);
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao alterar status da semana.");
    },
  });

  const sportNamesById = new Map(sports.data.map((sport) => [sport.id, sport.name]));
  const availableActions = getAvailableActions(week.status);
  const transferInfo = getTransferWindowInfo();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Semana #{week.week_number}</Badge>
              <Badge variant={week.status === "ACTIVE" ? "secondary" : "outline"}>
                {statusLabel[week.status]}
              </Badge>
            </div>
            <CardTitle className="text-2xl">Detalhe da semana</CardTitle>
            <CardDescription className="max-w-2xl">
              Controle o ciclo da semana com transicoes administrativas e acompanhe o calendario associado.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <QuickStat label="Periodo" value={`${formatDate(week.start_date)} - ${formatDate(week.end_date)}`} />
            <QuickStat label="Eventos" value={String(events.data.length)} />
            <QuickStat label="Preview de partidas" value={String(preview.matches.length)} />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Ações de estado</CardTitle>
            <CardDescription>
              Fluxo oficial: Publicar, Travar, Ativar e Encerrar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableActions.map((action) => (
              <button
                key={action}
                type="button"
                className={cn(buttonVariants({ variant: action === "lock" ? "outline" : "default" }), "w-full justify-start")}
                disabled={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate(action)}
              >
                {transitionLabel[action]}
              </button>
            ))}
            {availableActions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-3 text-sm text-muted-foreground">
                Nenhuma transicao disponivel para o status atual.
              </div>
            ) : null}
            <Link to="/dashboard/weeks" className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}>
              Voltar para lista
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Status e foco</CardTitle>
            <CardDescription>
              Resumo do periodo e dos esportes priorizados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Periodo: {formatDate(week.start_date)} ate {formatDate(week.end_date)}.
            </div>
            <div className="flex flex-wrap gap-2">
              {week.sport_focus.length > 0 ? (
                week.sport_focus.map((sportId) => (
                  <Badge key={sportId} variant="outline">
                    {sportNamesById.get(sportId) ?? `#${sportId}`}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Sem esportes foco definidos.</span>
              )}
            </div>
            <div className="rounded-xl border border-dashed border-border/80 p-3 text-sm text-muted-foreground">
              {transferInfo.open
                ? "Janela de transferencia aberta hoje em UTC-3."
                : `Proxima janela de transferencia: ${transferInfo.nextLabel}.`}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Preview da geracao</CardTitle>
            <CardDescription>
              Resposta atual do endpoint de pre-visualizacao do calendario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.matches.length > 0 ? (
              preview.matches.map((match, index) => (
                <div key={`${match.modality_id}-${index}`} className="rounded-2xl border border-border/70 bg-muted/25 p-4">
                  <div className="font-medium">{match.modality_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {match.team_a} x {match.team_b}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                Nenhum match previsto ainda para esta semana.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Eventos cadastrados</CardTitle>
          <CardDescription>
            Calendario atual desta semana, com status visivel para auditoria operacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.data.length > 0 ? (
            events.data.map((event) => (
              <div key={event.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">Evento #{event.id}</div>
                  <Badge variant={event.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                    {event.status}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {formatDate(event.event_date)} • {event.start_time} • modalidade #{event.modality_id}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
              Nenhum evento criado para esta semana.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const transitionLabel = {
  publish: "Publicar semana",
  lock: "Travar semana",
  activate: "Ativar semana",
  complete: "Encerrar semana",
} as const;

const transitionVerb = {
  publish: "publicada",
  lock: "travada",
  activate: "ativada",
  complete: "encerrada",
} as const;

function getAvailableActions(status: WeekStatus) {
  if (status === "DRAFT") return ["publish"] as const;
  if (status === "SCHEDULED") return ["lock"] as const;
  if (status === "LOCKED") return ["activate"] as const;
  if (status === "ACTIVE") return ["complete"] as const;
  return [] as const;
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function getTransferWindowInfo() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const weekday = parts.weekday;
  const open = weekday === "Mon";
  const current = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`);
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const daysUntilMonday = (8 - dayIndex) % 7 || 7;
  const nextMonday = new Date(current);
  nextMonday.setDate(current.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  return {
    open,
    nextLabel: nextMonday.toLocaleString("pt-BR", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }),
  };
}
