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

import * as m from "@/paraglide/messages";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { formatDate } from "@/shared/lib/date";
import { competitionEventsQueryOptions } from "@/features/events/api/queries";
import { queryKeys } from "@/features/keys";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import {
  competitionDetailQueryOptions,
  competitionSchedulePreviewQueryOptions,
} from "@/features/competitions/api/queries";
import type { CompetitionStatus } from "@/types/competitions";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/competitions/$competitionId/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId, competitionId } }) => {
    const id = Number(competitionId);
    void queryClient.prefetchQuery(competitionDetailQueryOptions(Number(leagueId), id));
    void queryClient.prefetchQuery(competitionEventsQueryOptions(Number(leagueId), id));
    void queryClient.prefetchQuery(sportListQueryOptions());
    void queryClient.prefetchQuery(competitionSchedulePreviewQueryOptions(Number(leagueId), id));
  },
  component: CompetitionDetailPage,
});

const statusLabel: Record<CompetitionStatus, string> = {
  DRAFT: m['common.status.draft'](),
  SCHEDULED: m['common.status.scheduled'](),
  LOCKED: m['common.status.locked'](),
  ACTIVE: m['common.status.active'](),
  COMPLETED: m['common.status.completed'](),
};

function CompetitionDetailPage() {
  const queryClient = useQueryClient();
  const { competitionId, leagueId } = Route.useParams();
  const competitionNumber = Number(competitionId);
  const { data: competition } = useSuspenseQuery(
    competitionDetailQueryOptions(Number(leagueId), competitionNumber),
  );
  const { data: events } = useSuspenseQuery(
    competitionEventsQueryOptions(Number(leagueId), competitionNumber),
  );
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());
  const { data: preview } = useSuspenseQuery(
    competitionSchedulePreviewQueryOptions(Number(leagueId), competitionNumber),
  );

  const refreshCompetition = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: queryKeys.competitions.detail(Number(leagueId), competitionNumber),
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all(Number(leagueId)) }),
      queryClient.invalidateQueries({
        queryKey: [
          ...queryKeys.competitions.detail(Number(leagueId), competitionNumber),
          "schedule-preview",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.events.byCompetition(Number(leagueId), competitionNumber),
      }),
    ]);
  };

  const transitionMutation = useMutation({
    mutationFn: async (action: "publish" | "lock" | "activate" | "complete") =>
      unwrap(
        client.POST(`/leagues/{league_id}/competitions/{competition_id}/${action}`, {
          params: { path: { league_id: Number(leagueId), competition_id: competitionNumber } },
        }),
      ),
    onSuccess: async (_, action) => {
      await refreshCompetition();
      toast.success(`Competicao ${transitionVerb[action]} com sucesso.`);
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Falha ao alterar status da competicao.",
      );
    },
  });

  const sportNamesById = new Map(sports.data.map((sport) => [sport.id, sport.name]));
  const availableActions = getAvailableActions(competition.status);
  const transferInfo = getTransferWindowInfo();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{m['competition.admin.badge.competition']({ "competition.number": competition.number })}</Badge>
              <Badge variant={competition.status === "ACTIVE" ? "secondary" : "outline"}>
                {statusLabel[competition.status]}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{m['competition.admin.detail.title']()}</CardTitle>
            <CardDescription className="max-w-2xl">
              Controle o ciclo da competicao com transicoes administrativas e acompanhe o calendario
              associado.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <QuickStat
              label={m['competition.admin.detail.period']()}
              value={`${formatDate(competition.start_date)} - ${formatDate(competition.end_date)}`}
            />
            <QuickStat label={m['competition.admin.detail.stat.events']()} value={String(events.data.length)} />
            <QuickStat label={m['competition.admin.detail.stat.preview']()} value={String(preview.matches.length)} />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m['competition.admin.card.actions.title']()}</CardTitle>
            <CardDescription>{m['competition.admin.card.actions.desc']()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableActions.map((action) => (
              <button
                key={action}
                type="button"
                className={cn(
                  buttonVariants({ variant: action === "lock" ? "outline" : "default" }),
                  "w-full justify-start",
                )}
                disabled={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate(action)}
              >
                {transitionLabel[action]}
              </button>
            ))}
            {availableActions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/80 p-3 text-sm text-muted-foreground">
                {m['competition.admin.empty.transitions']()}
              </div>
            ) : null}
            <Link
              to="/leagues/$leagueId/dashboard/competitions"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "ghost" }), "w-full justify-start")}
            >
              {m['common.actions.back']()}
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m['competition.admin.card.status.title']()}</CardTitle>
            <CardDescription>{m['competition.admin.card.status.desc']()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Periodo: {formatDate(competition.start_date)} ate {formatDate(competition.end_date)}.
            </div>
            <div className="flex flex-wrap gap-2">
              {competition.sport_focus.length > 0 ? (
                competition.sport_focus
                  .filter((sportId): sportId is number => typeof sportId === "number")
                  .map((sportId) => (
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
                ? m['transferWindow.openMessage']()
                : `Proxima janela de transferencia: ${transferInfo.nextLabel}.`}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m['competition.admin.card.preview.title']()}</CardTitle>
            <CardDescription>
              Resposta atual do endpoint de pre-visualizacao do calendario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {preview.matches.length > 0 ? (
              preview.matches.map((match, index) => (
                <div
                  key={`${match.modality_id}-${index}`}
                  className="rounded-2xl border border-border/70 bg-muted/25 p-4"
                >
                  <div className="font-medium">{match.modality_name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {match.team_a} x {match.team_b}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                {m['competition.admin.empty.matches']()}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>{m['competition.admin.card.events.title']()}</CardTitle>
          <CardDescription>
            Calendario atual desta competicao, com status visivel para auditoria operacional.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.data.length > 0 ? (
            events.data.map((event) => (
              <div
                key={event.id}
                className="rounded-2xl border border-border/70 bg-background/80 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">Evento #{event.id}</div>
                  <Badge variant={event.status === "IN_PROGRESS" ? "secondary" : "outline"}>
                    {event.status}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {formatDate(event.event_date)} • {event.start_time} • modalidade #
                  {event.modality_id}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
              {m['competition.admin.empty.events']()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const transitionLabel = {
  publish: m['competition.transition.publish'](),
  lock: m['competition.transition.lock'](),
  activate: m['competition.transition.activate'](),
  complete: m['competition.transition.complete'](),
} as const;

const transitionVerb = {
  publish: m['competition.transition.verb.publish'](),
  lock: m['competition.transition.verb.lock'](),
  activate: m['competition.transition.verb.activate'](),
  complete: m['competition.transition.verb.complete'](),
} as const;

function getAvailableActions(status: CompetitionStatus) {
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
  const current = new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`,
  );
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
