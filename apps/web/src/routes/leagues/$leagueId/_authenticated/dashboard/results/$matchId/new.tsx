import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@sports-system/ui/components/alert";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { cn } from "@sports-system/ui/lib/utils";

import { client, unwrap, ApiError } from "@/shared/lib/api";
import { formatDate, formatTime } from "@/shared/lib/date";
import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { eventDetailQueryOptions } from "@/features/events/api/queries";
import { queryKeys } from "@/features/keys";
import { matchDetailQueryOptions } from "@/features/matches/api/queries";
import { resultListQueryOptions } from "@/features/results/api/queries";
import { sportDetailQueryOptions, sportListQueryOptions } from "@/features/sports/api/queries";
import type { Medal } from "@/types/results";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/results/$matchId/new",
)({
  ssr: false,
  loader: async ({ context: { queryClient }, params: { leagueId, matchId } }) => {
    const numericMatchId = Number(matchId);
    const match = await queryClient.ensureQueryData(matchDetailQueryOptions(numericMatchId));
    const event = await queryClient.ensureQueryData(
      eventDetailQueryOptions(Number(leagueId), match.event_id),
    );
    const sports = await queryClient.ensureQueryData(sportListQueryOptions());

    await Promise.all([
      queryClient.ensureQueryData(delegationListQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(athleteListQueryOptions(Number(leagueId), { per_page: 500 })),
      queryClient.ensureQueryData(resultListQueryOptions(Number(leagueId), { per_page: 200 })),
      ...sports.data.map((sport) => queryClient.ensureQueryData(sportDetailQueryOptions(sport.id))),
      Promise.resolve(event),
    ]);
  },
  component: MatchResultEntryPage,
});

function MatchResultEntryPage() {
  const queryClient = useQueryClient();
  const { leagueId, matchId } = Route.useParams();
  const numericMatchId = Number(matchId);
  const { data: match } = useSuspenseQuery(matchDetailQueryOptions(numericMatchId));
  const { data: event } = useSuspenseQuery(
    eventDetailQueryOptions(Number(leagueId), match.event_id),
  );
  const { data: allResults } = useSuspenseQuery(
    resultListQueryOptions(Number(leagueId), { per_page: 200 }),
  );
  const { data: athletesData } = useSuspenseQuery(
    athleteListQueryOptions(Number(leagueId), { per_page: 500 }),
  );
  const { data: delegationsData } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const { data: sportsData } = useSuspenseQuery(sportListQueryOptions());
  const sportDetails = useSuspenseQueries({
    queries: sportsData.data.map((sport) => sportDetailQueryOptions(sport.id)),
  });

  const modalityById = useMemo(
    () =>
      new Map(
        sportDetails.flatMap((detail) =>
          detail.data.modalities.map((modality) => [modality.id, modality] as const),
        ),
      ),
    [sportDetails],
  );
  const sportByModalityId = useMemo(
    () =>
      new Map(
        sportDetails.flatMap((detail) =>
          detail.data.modalities.map((modality) => [modality.id, detail.data] as const),
        ),
      ),
    [sportDetails],
  );
  const delegationById = useMemo(
    () => new Map(delegationsData.data.map((delegation) => [delegation.id, delegation])),
    [delegationsData.data],
  );
  const athleteById = useMemo(
    () => new Map(athletesData.data.map((athlete) => [athlete.id, athlete])),
    [athletesData.data],
  );

  const modality = modalityById.get(event.modality_id) ?? null;
  const sport = sportByModalityId.get(event.modality_id) ?? null;
  const existingResults = allResults.data.filter((result) => result.match_id === numericMatchId);
  const editable = existingResults[0] ?? null;

  const [rank, setRank] = useState(editable ? String(editable.rank) : "1");
  const [medal, setMedal] = useState<Medal | "NONE">(editable?.medal ?? "NONE");
  const [delegationId, setDelegationId] = useState(
    editable?.delegation_id
      ? String(editable.delegation_id)
      : match.team_a_delegation_id
        ? String(match.team_a_delegation_id)
        : "",
  );
  const [athleteId, setAthleteId] = useState(
    editable?.athlete_id ? String(editable.athlete_id) : "",
  );
  const [valueJsonText, setValueJsonText] = useState(
    JSON.stringify(
      editable?.value_json ?? buildSuggestedValueJson(modality?.rules_json, sport?.stats_schema),
      null,
      2,
    ),
  );

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.results.all(Number(leagueId)) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.matches.detail(numericMatchId) }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = parseValueJson(valueJsonText);
      if (editable) {
        return unwrap(
          client.PATCH("/leagues/{league_id}/results/{result_id}", {
            params: { path: { league_id: Number(leagueId), result_id: editable.id } },
            body: {
              rank: Number(rank),
              medal: medal === "NONE" ? null : medal,
              value_json: parsed,
            },
          }),
        );
      }

      return unwrap(
        client.POST("/leagues/{league_id}/results", {
          params: { path: { league_id: Number(leagueId) } },
          body: {
            match_id: numericMatchId,
            delegation_id: delegationId ? Number(delegationId) : null,
            athlete_id: athleteId ? Number(athleteId) : null,
            rank: Number(rank),
            medal: medal === "NONE" ? null : medal,
            value_json: parsed,
          },
        }),
      );
    },
    onSuccess: async () => {
      await refresh();
      toast.success(editable ? "Resultado atualizado." : "Resultado criado.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao salvar resultado.");
    },
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.20))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Entrada manual</Badge>
              <Badge variant="secondary">Partida #{match.id}</Badge>
            </div>
            <CardTitle className="text-2xl">
              {sport?.name ?? "Esporte"} · {modality?.name ?? `Modalidade #${event.modality_id}`}
            </CardTitle>
            <CardDescription>
              {formatDate(event.event_date)} · {formatTime(event.start_time)} · status{" "}
              {match.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <QuickBlock
              label="Delegação A"
              value={labelDelegation(match.team_a_delegation_id, delegationById)}
            />
            <QuickBlock
              label="Placar"
              value={
                match.score_a != null && match.score_b != null
                  ? `${match.score_a} x ${match.score_b}`
                  : "Sem placar"
              }
            />
            <QuickBlock
              label="Delegação B"
              value={labelDelegation(match.team_b_delegation_id, delegationById)}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/leagues/$leagueId/dashboard/results"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")}
            >
              Voltar ao painel
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{editable ? "Editar resultado" : "Novo resultado"}</CardTitle>
            <CardDescription>Campos específicos do esporte entram em `value_json`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="result-rank">Posição</FieldLabel>
                  <Input
                    id="result-rank"
                    type="number"
                    min="1"
                    value={rank}
                    onChange={(event) => setRank(event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="result-medal">Medalha</FieldLabel>
                  <select
                    id="result-medal"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={medal}
                    onChange={(event) => setMedal(event.target.value as Medal | "NONE")}
                  >
                    <option value="NONE">Sem medalha</option>
                    <option value="GOLD">Ouro</option>
                    <option value="SILVER">Prata</option>
                    <option value="BRONZE">Bronze</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="result-delegation">Delegação</FieldLabel>
                  <select
                    id="result-delegation"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={delegationId}
                    onChange={(event) => setDelegationId(event.target.value)}
                  >
                    <option value="">Nenhuma</option>
                    {delegationsData.data.map((delegation) => (
                      <option key={delegation.id} value={String(delegation.id)}>
                        {delegation.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="result-athlete">Atleta</FieldLabel>
                  <select
                    id="result-athlete"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={athleteId}
                    onChange={(event) => setAthleteId(event.target.value)}
                  >
                    <option value="">Nenhum</option>
                    {athletesData.data.map((athlete) => (
                      <option key={athlete.id} value={String(athlete.id)}>
                        {athlete.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="result-value-json">Payload específico</FieldLabel>
                <textarea
                  id="result-value-json"
                  className="min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  value={valueJsonText}
                  onChange={(event) => setValueJsonText(event.target.value)}
                />
                <FieldDescription>
                  Use este objeto para estatísticas específicas do esporte.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending
                ? "Salvando..."
                : editable
                  ? "Atualizar resultado"
                  : "Criar resultado"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Resultados atuais</CardTitle>
            <CardDescription>Itens já associados à partida.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {existingResults.length > 0 ? (
              existingResults.map((result) => (
                <div
                  key={result.id}
                  className="rounded-3xl border border-border/70 bg-muted/15 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-medium">
                      {result.delegation_id
                        ? labelDelegation(result.delegation_id, delegationById)
                        : "Sem delegação"}
                    </div>
                    <Badge variant="outline">{result.medal ?? "Sem medalha"}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Rank {result.rank} ·{" "}
                    {result.athlete_id
                      ? (athleteById.get(result.athlete_id)?.name ?? `Atleta #${result.athlete_id}`)
                      : "Sem atleta"}
                  </div>
                  <div className="mt-2 rounded-2xl bg-background px-3 py-2 text-xs text-muted-foreground">
                    {result.value_json ? JSON.stringify(result.value_json) : "{}"}
                  </div>
                </div>
              ))
            ) : (
              <Alert>
                <AlertTitle>Sem resultado manual</AlertTitle>
                <AlertDescription>
                  Use o formulário ou a geração com IA para registrar dados desta partida.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function QuickBlock({ label, value }: { label: string; value: string }) {
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
) {
  if (!delegationId) {
    return "A definir";
  }
  return delegationById.get(delegationId)?.name ?? `Delegação #${delegationId}`;
}

function buildSuggestedValueJson(
  rulesJson?: Record<string, unknown>,
  statsSchema?: Record<string, unknown> | null,
) {
  return {
    rules: rulesJson ?? {},
    stats: statsSchema ?? {},
  };
}

function parseValueJson(text: string) {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new ApiError(422, "INVALID_JSON", "JSON inválido no payload do resultado.");
  }
}
