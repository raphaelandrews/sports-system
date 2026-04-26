import {
  useMutation,
  useQueryClient,
  useSuspenseQueries,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Bot, Download, Sparkles, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
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

import { MedalBoard } from "@/features/results/components/medal-board";
import { client, unwrap, unwrapBlob, ApiError } from "@/shared/lib/api";
import { formatDate, formatTime } from "@/shared/lib/date";
import { allEventsQueryOptions, eventDetailQueryOptions } from "@/features/events/api/queries";
import { queryKeys } from "@/features/keys";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { medalBoardQueryOptions } from "@/features/results/api/queries";
import { sportDetailQueryOptions, sportListQueryOptions } from "@/features/sports/api/queries";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/results/")({
  ssr: false,
  loader: async ({ context: { queryClient }, params: { leagueId } }) => {
    const sports = await queryClient.ensureQueryData(sportListQueryOptions());

    await Promise.all([
      queryClient.ensureQueryData(medalBoardQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(allEventsQueryOptions(Number(leagueId), { per_page: 200 })),
      queryClient.ensureQueryData(competitionListQueryOptions(Number(leagueId))),
      ...sports.data.map((sport) => queryClient.ensureQueryData(sportDetailQueryOptions(sport.id))),
    ]);
  },
  component: ResultsPage,
});

async function triggerCsvDownload(leagueId: number) {
  const blob = await unwrapBlob(`/leagues/${leagueId}/report/export/csv`);
  triggerBlobDownload(blob, "results.csv");
}

async function triggerXlsxDownload(leagueId: number) {
  const blob = await unwrapBlob(`/leagues/${leagueId}/report/export/xlsx`);
  triggerBlobDownload(blob, "results.xlsx");
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ResultsPage() {
  const queryClient = useQueryClient();
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery({
    ...medalBoardQueryOptions(Number(leagueId)),
    refetchInterval: 30_000,
  });
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions(Number(leagueId), { per_page: 200 }),
  );
  const { data: competitionsData } = useSuspenseQuery(
    competitionListQueryOptions(Number(leagueId)),
  );
  const { data: sportsData } = useSuspenseQuery(sportListQueryOptions());
  const sportDetails = useSuspenseQueries({
    queries: sportsData.data.map((sport) => sportDetailQueryOptions(sport.id)),
  });
  const [eventId, setEventId] = useState("");

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
  const competitionById = useMemo(
    () => new Map(competitionsData.data.map((competition) => [competition.id, competition])),
    [competitionsData.data],
  );
  const openEvents = [...eventsData.data].sort((a, b) =>
    `${a.event_date}T${a.start_time}`.localeCompare(`${b.event_date}T${b.start_time}`),
  );

  const aiMutation = useMutation({
    mutationFn: async (selectedEventId: number) =>
      unwrap(
        client.POST("/leagues/{league_id}/results/ai-generate/{event_id}", {
          params: { path: { league_id: Number(leagueId), event_id: selectedEventId } },
        }),
      ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.results.all(Number(leagueId)) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches.all() }),
      ]);
      toast.success("Resultados gerados com IA.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao gerar resultados.");
    },
  });

  const csvMutation = useMutation({
    mutationFn: () => triggerCsvDownload(Number(leagueId)),
    onSuccess: () => toast.success("Exportação CSV iniciada."),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao exportar CSV.");
    },
  });
  const xlsxMutation = useMutation({
    mutationFn: () => triggerXlsxDownload(Number(leagueId)),
    onSuccess: () => toast.success("Exportação XLSX iniciada."),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao exportar XLSX.");
    },
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.20))]">
          <CardHeader className="gap-3">
            <Badge variant="outline" className="w-fit">
              Resultados
            </Badge>
            <CardTitle className="text-2xl">Painel de resultados</CardTitle>
            <CardDescription className="max-w-2xl">
              Revise medalhas, abra entrada por partida e acione geração automática quando
              necessário.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <QuickTile label="Delegações no quadro" value={String(data.length)} />
            <QuickTile
              label="Ouros"
              value={String(data.reduce((sum, entry) => sum + entry.gold, 0))}
            />
            <QuickTile
              label="Medalhas totais"
              value={String(data.reduce((sum, entry) => sum + entry.total, 0))}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
            <CardDescription>
              Entrada manual por partida ou geração assistida por evento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={eventId} onValueChange={(value) => setEventId(value ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um evento" />
              </SelectTrigger>
              <SelectContent>
                {openEvents.map((event) => {
                  const modality = modalityById.get(event.modality_id);
                  const sport = sportByModalityId.get(event.modality_id);
                  const competition = competitionById.get(event.competition_id);
                  return (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {sport?.name ?? "Esporte"} · {modality?.name ?? `Evento #${event.id}`} ·
                      Competição {competition?.number ?? "?"} · {formatDate(event.event_date)} ·{" "}
                      {formatTime(event.start_time)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Button
              type="button"
              className="w-full justify-start"
              variant="secondary"
              disabled={aiMutation.isPending || !eventId}
              onClick={() => aiMutation.mutate(Number(eventId))}
            >
              <Sparkles className="mr-2 size-4" />
              {aiMutation.isPending ? "Gerando..." : "Gerar Resultados com IA"}
            </Button>

            <Button
              type="button"
              className="w-full justify-start"
              variant="outline"
              disabled={csvMutation.isPending}
              onClick={() => csvMutation.mutate()}
            >
              <Download className="mr-2 size-4" />
              {csvMutation.isPending ? "Exportando..." : "Exportar resultados (CSV)"}
            </Button>

            <Button
              type="button"
              className="w-full justify-start"
              variant="outline"
              disabled={xlsxMutation.isPending}
              onClick={() => xlsxMutation.mutate()}
            >
              <Download className="mr-2 size-4" />
              {xlsxMutation.isPending ? "Exportando..." : "Exportar resultados (XLSX)"}
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="size-4" />
            Quadro geral
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <MedalBoard entries={data} />
        </CardContent>
      </Card>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Eventos para entrada manual</CardTitle>
          <CardDescription>
            Abra a página específica da partida para registrar ou editar resultados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {openEvents.slice(0, 18).map((event) => {
            const modality = modalityById.get(event.modality_id);
            const sport = sportByModalityId.get(event.modality_id);
            return (
              <EventResultCard
                key={event.id}
                event={event}
                sportName={sport?.name ?? "Esporte"}
                modalityName={modality?.name ?? `Evento #${event.id}`}
              />
            );
          })}
          {openEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 p-8 text-sm text-muted-foreground">
              Nenhum evento disponível.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function QuickTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function EventResultCard({
  event,
  sportName,
  modalityName,
}: {
  event: { id: number; event_date: string; start_time: string };
  sportName: string;
  modalityName: string;
}) {
  const { leagueId } = Route.useParams();
  const { data: detail } = useSuspenseQuery(eventDetailQueryOptions(Number(leagueId), event.id));

  return (
    <div className="rounded-3xl border border-border/70 bg-muted/15 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{sportName}</div>
      <div className="mt-2 font-semibold">{modalityName}</div>
      <div className="mt-1 text-sm text-muted-foreground">
        {formatDate(event.event_date)} · {formatTime(event.start_time)}
      </div>
      <div className="mt-4 space-y-2">
        {detail.matches.map((match) => (
          <Link
            key={match.id}
            to="/leagues/$leagueId/dashboard/results/$matchId/new"
            params={{ leagueId, matchId: String(match.id) }}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-start",
            )}
          >
            <Bot className="mr-2 size-4" />
            Partida #{match.id}
          </Link>
        ))}
        {detail.matches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
            Sem partidas geradas.
          </div>
        ) : null}
      </div>
    </div>
  );
}
