import * as React from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@sports-system/ui/components/badge";
import { Button } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { buildApiUrl } from "@/shared/lib/url";
import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { matchDetailQueryOptions } from "@/features/matches/api/queries";
import { queryKeys } from "@/features/keys";
import type { MatchEventCreate, MatchEventType, MatchParticipantResponse } from "@/types/events";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/matches/$matchId/")({
  ssr: false,
  loader: async ({ context: { queryClient }, params: { leagueId, matchId } }) => {
    const numericMatchId = Number(matchId);

    await Promise.all([
      queryClient.ensureQueryData(matchDetailQueryOptions(numericMatchId)),
      queryClient.ensureQueryData(delegationListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(athleteListQueryOptions(Number(leagueId), { per_page: 500 })),
    ]);
  },
  component: MatchLivePage,
});

const eventTypeOptions: { value: MatchEventType; label: string }[] = [
  { value: "GOAL", label: "Gol" },
  { value: "POINT", label: "Ponto" },
  { value: "PENALTY", label: "Penalidade" },
  { value: "CARD_YELLOW", label: "Cartao amarelo" },
  { value: "CARD_RED", label: "Cartao vermelho" },
  { value: "SUBSTITUTION", label: "Substituicao" },
  { value: "SET_END", label: "Fim de set" },
  { value: "IPPON", label: "Ippon" },
  { value: "WAZA_ARI", label: "Waza-ari" },
];

function MatchLivePage() {
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const { leagueId, matchId } = Route.useParams();
  const numericMatchId = Number(matchId);
  const { data: match } = useSuspenseQuery(matchDetailQueryOptions(numericMatchId));
  const { data: athletes } = useSuspenseQuery(
    athleteListQueryOptions(Number(leagueId), { per_page: 500 }),
  );
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));

  React.useEffect(() => {
    const source = new EventSource(buildApiUrl(`/matches/${numericMatchId}/stream`), {
      withCredentials: true,
    });

    source.onmessage = () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.matches.detail(numericMatchId),
      });
    };

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [numericMatchId, queryClient]);

  const athleteById = new Map(athletes.data.map((athlete) => [athlete.id, athlete]));
  const delegationById = new Map(delegations.data.map((delegation) => [delegation.id, delegation]));
  const adminView = session!.role === "ADMIN";

  const eventMutation = useMutation({
    mutationFn: (payload: MatchEventCreate) =>
      unwrap(
        client.POST("/matches/{match_id}/events", {
          params: { path: { match_id: numericMatchId } },
          body: payload,
        }),
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(numericMatchId) });
      toast.success("Evento registrado.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao registrar evento.");
    },
  });

  const lifecycleMutation = useMutation({
    mutationFn: async (action: "start" | "finish") => {
      return unwrap(
        client.POST(`/matches/{match_id}/${action}`, {
          params: { path: { match_id: numericMatchId } },
        }),
      );
    },
    onSuccess: async (_, action) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(numericMatchId) });
      toast.success(
        action === "start" ? "Partida iniciada." : "Partida encerrada.",
      );
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao atualizar partida.");
    },
  });

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.2),transparent_36%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Partida #{match.id}</Badge>
              <Badge variant={match.status === "IN_PROGRESS" ? "default" : "secondary"}>
                {match.status}
              </Badge>
            </div>
            <CardTitle className="text-3xl">
              {labelDelegation(match.team_a_delegation_id, delegationById)} x{" "}
              {labelDelegation(match.team_b_delegation_id, delegationById)}
            </CardTitle>
            <CardDescription>Placar atualizado via SSE.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <ScorePanel
              title={labelDelegation(match.team_a_delegation_id, delegationById)}
              score={match.score_a}
            />
            <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-background/80 p-4 text-2xl font-semibold">
              {match.score_a != null && match.score_b != null
                ? `${match.score_a} x ${match.score_b}`
                : "Aguardando"}
            </div>
            <ScorePanel
              title={labelDelegation(match.team_b_delegation_id, delegationById)}
              score={match.score_b}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Participantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {match.participants.length > 0 ? (
              match.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-2xl border border-border/70 bg-muted/15 p-3"
                >
                  <div className="font-medium">
                    {athleteById.get(participant.athlete_id)?.name ??
                      `Atleta #${participant.athlete_id}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {labelDelegation(participant.delegation_id_at_time, delegationById)} ·{" "}
                    {participant.role}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                Sem participantes registrados.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Feed ao vivo</CardTitle>
            <CardDescription>Eventos registrados e sincronizados em tempo real.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {match.events.length > 0 ? (
              [...match.events]
                .sort((a, b) => {
                  if (a.minute == null && b.minute == null) {
                    return a.created_at.localeCompare(b.created_at);
                  }
                  return (a.minute ?? 999) - (b.minute ?? 999);
                })
                .map((event) => (
                  <div
                    key={event.id}
                    className="grid gap-3 rounded-3xl border border-border/70 bg-muted/15 p-4 md:grid-cols-[auto,1fr]"
                  >
                    <div className="rounded-2xl bg-background px-3 py-2 text-center text-sm font-semibold">
                      {event.minute != null ? `${event.minute}'` : "Tempo"}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {eventTypeOptions.find((option) => option.value === event.event_type)
                          ?.label ?? event.event_type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {event.athlete_id
                          ? (athleteById.get(event.athlete_id)?.name ??
                            `Atleta #${event.athlete_id}`)
                          : "Sem atleta"}
                        {" · "}
                        {event.delegation_id_at_time
                          ? labelDelegation(event.delegation_id_at_time, delegationById)
                          : "Sem delegacao"}
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 p-8 text-sm text-muted-foreground">
                Nenhum evento registrado ainda.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Controle admin</CardTitle>
            <CardDescription>Inicio, encerramento e registro manual de eventos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {adminView ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={lifecycleMutation.isPending}
                    onClick={() => lifecycleMutation.mutate("start")}
                  >
                    Iniciar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={lifecycleMutation.isPending}
                    onClick={() => lifecycleMutation.mutate("finish")}
                  >
                    Encerrar
                  </Button>
                </div>

                <MatchEventForm
                  participants={match.participants}
                  athleteById={athleteById}
                  delegationById={delegationById}
                  isPending={eventMutation.isPending}
                  onSubmit={async (payload) => {
                    await eventMutation.mutateAsync(payload);
                  }}
                />
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                Somente administradores podem controlar esta partida.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MatchEventForm({
  participants,
  athleteById,
  delegationById,
  isPending,
  onSubmit,
}: {
  participants: MatchParticipantResponse[];
  athleteById: Map<number, { id: number; name: string }>;
  delegationById: Map<number, { id: number; name: string }>;
  isPending: boolean;
  onSubmit: (payload: MatchEventCreate) => Promise<void>;
}) {
  const [form, setForm] = React.useState({
    minute: "",
    event_type: "GOAL" as MatchEventType,
    athlete_id: "",
    delegation_id_at_time: "",
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          minute: form.minute ? Number(form.minute) : null,
          event_type: form.event_type,
          athlete_id: form.athlete_id ? Number(form.athlete_id) : null,
          delegation_id_at_time: form.delegation_id_at_time
            ? Number(form.delegation_id_at_time)
            : null,
          value_json: null,
        });
      }}
    >
      <FieldGroup>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Tipo</FieldLabel>
            <Select
              value={form.event_type}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, event_type: value as MatchEventType }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {eventTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="event-minute">Minuto</FieldLabel>
            <Input
              id="event-minute"
              type="number"
              min="0"
              max="200"
              value={form.minute}
              onChange={(event) =>
                setForm((current) => ({ ...current, minute: event.target.value }))
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Atleta</FieldLabel>
            <Select
              value={form.athlete_id}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, athlete_id: value ?? "" }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((participant) => (
                  <SelectItem key={participant.id} value={String(participant.athlete_id)}>
                    {athleteById.get(participant.athlete_id)?.name ??
                      `Atleta #${participant.athlete_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Delegacao</FieldLabel>
            <Select
              value={form.delegation_id_at_time}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  delegation_id_at_time: value ?? "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                {Array.from(
                  new Set(participants.map((participant) => participant.delegation_id_at_time)),
                ).map((delegationId) => (
                  <SelectItem key={delegationId} value={String(delegationId)}>
                    {delegationById.get(delegationId)?.name ?? `Delegacao #${delegationId}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Use snapshot da delegacao no momento da partida.</FieldDescription>
          </Field>
        </div>
      </FieldGroup>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Registrando..." : "Registrar evento"}
      </Button>
    </form>
  );
}

function ScorePanel({ title, score }: { title: string; score: number | null }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{title}</div>
      <div className="mt-3 text-4xl font-semibold">{score ?? "-"}</div>
    </div>
  );
}

function labelDelegation(
  delegationId: number | null | undefined,
  delegationById: Map<number, { name: string }>,
) {
  if (!delegationId) {
    return "A definir";
  }

  return delegationById.get(delegationId)?.name ?? `Delegacao #${delegationId}`;
}
