import { useMutation, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Download, Medal, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";

import { Button } from "@sports-system/ui/components/button";
import { MedalBoard } from "@/components/results/medal-board";
import { apiFetchBlob, ApiError } from "@/lib/api";
import { SportStandings } from "@/components/results/sport-standings";
import { formatEventDate } from "@/lib/date";
import { finalReportQueryOptions } from "@/queries/reports";
import { modalityStandingsQueryOptions } from "@/queries/results";
import { sportDetailQueryOptions, sportListQueryOptions } from "@/queries/sports";

export const Route = createFileRoute("/(public)/report/")({
  loader: async ({ context: { queryClient } }) => {
    const sports = await queryClient.ensureQueryData(sportListQueryOptions());

    await Promise.all([
      queryClient.ensureQueryData(finalReportQueryOptions()),
      ...sports.data.map((sport) => queryClient.ensureQueryData(sportDetailQueryOptions(sport.id))),
    ]);
  },
  component: PublicReportPage,
});

async function triggerCsvDownload() {
  const blob = await apiFetchBlob("/report/export/csv");
  triggerBlobDownload(blob, "results.csv");
}

async function triggerXlsxDownload() {
  const blob = await apiFetchBlob("/report/export/xlsx");
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

function PublicReportPage() {
  const { data: report } = useSuspenseQuery(finalReportQueryOptions());
  const csvMutation = useMutation({
    mutationFn: triggerCsvDownload,
    onSuccess: () => toast.success("Exportação CSV iniciada."),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao exportar CSV.");
    },
  });
  const xlsxMutation = useMutation({
    mutationFn: triggerXlsxDownload,
    onSuccess: () => toast.success("Exportação XLSX iniciada."),
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao exportar XLSX.");
    },
  });
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());
  const sportDetails = useSuspenseQueries({
    queries: sports.data.map((sport) => sportDetailQueryOptions(sport.id)),
  });
  const standings = useSuspenseQueries({
    queries: sportDetails.flatMap((sport) =>
      sport.data.modalities.map((modality) => modalityStandingsQueryOptions(modality.id)),
    ),
  });

  const athleteHighlights = [...report.records]
    .filter((record) => record.athlete_name)
    .slice(0, 6);

  let standingsIndex = 0;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_34%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.18),transparent_28%),linear-gradient(180deg,hsl(var(--muted)/0.22),transparent)]" />
      <div className="container mx-auto max-w-7xl space-y-8 px-4 py-10">
        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card className="border border-border/70 bg-[linear-gradient(150deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
            <CardHeader className="gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Relatório final</Badge>
                <Badge variant="secondary">Público</Badge>
              </div>
              <div className="space-y-3">
                <CardTitle className="max-w-3xl text-4xl leading-tight">
                  Encerramento competitivo com quadro geral, classificação por modalidade e destaques da edição.
                </CardTitle>
                <CardDescription className="max-w-2xl text-base">
                  Painel consolidado para leitura pública da competição, com medalhas, recordes, modalidades e recorte dos atletas em evidência.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <ReportStat label="Delegações" value={String(report.summary.total_delegations)} />
              <ReportStat label="Atletas" value={String(report.summary.total_athletes)} />
              <ReportStat label="Competições" value={String(report.summary.total_competitions)} />
              <ReportStat label="Eventos" value={String(report.summary.total_events)} />
              <ReportStat label="Partidas" value={String(report.summary.total_matches)} />
              <ReportStat label="Concluídas" value={String(report.summary.completed_matches)} />
            </CardContent>
          </Card>

          <Card className="border border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.16))]">
            <CardHeader>
              <CardTitle>Rotas rápidas</CardTitle>
              <CardDescription>
                Entradas públicas para aprofundar a leitura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                to="/results"
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
              >
                Ver resultados ao vivo
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/results/records"
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
              >
                Abrir recordes
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/calendar"
                className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}
              >
                Revisar calendário
                <ArrowRight className="size-4" />
              </Link>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                disabled={csvMutation.isPending}
                onClick={() => csvMutation.mutate()}
              >
                {csvMutation.isPending ? "Exportando..." : "Exportar resultados (CSV)"}
                <Download className="size-4" />
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                disabled={xlsxMutation.isPending}
                onClick={() => xlsxMutation.mutate()}
              >
                {xlsxMutation.isPending ? "Exportando..." : "Exportar resultados (XLSX)"}
                <Download className="size-4" />
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="size-4" />
                Quadro de medalhas completo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <MedalBoard entries={report.medal_board} />
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4" />
                Destaque de atletas
              </CardTitle>
              <CardDescription>
                Recorte guiado pelos recordes e melhores marcas registrados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {athleteHighlights.map((record) => (
                <div key={record.id} className="rounded-3xl border border-border/70 bg-muted/15 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{record.athlete_name}</div>
                    <Badge variant="outline">{record.modality_name}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {record.delegation_name} · {record.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatEventDate(record.set_at, { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              ))}
              {athleteHighlights.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                  Nenhum destaque disponível ainda.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-4" />
                Presença por esporte
              </CardTitle>
              <CardDescription>
                Distribuição de atletas vinculados por modalidade/esporte.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Esporte</TableHead>
                    <TableHead className="text-right">Atletas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.athletes_by_sport.map((entry) => (
                    <TableRow key={entry.sport_id}>
                      <TableCell className="font-medium">{entry.sport_name}</TableCell>
                      <TableCell className="text-right">{entry.athlete_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle>Recordes e melhores marcas</CardTitle>
              <CardDescription>
                Painel compacto dos principais resultados com marca registrada.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {report.records.slice(0, 8).map((record) => (
                <div key={record.id} className="rounded-3xl border border-border/70 bg-background/80 p-4">
                  <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    {record.modality_name}
                  </div>
                  <div className="mt-2 font-semibold">{record.value}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {record.athlete_name} · {record.delegation_name}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-4" />
            <h2 className="text-2xl font-semibold">Classificação por modalidade</h2>
          </div>

          <div className="grid gap-4">
            {sportDetails.map((sport) => (
              <Card key={sport.data.id} className="border border-border/70">
                <CardHeader>
                  <CardTitle>{sport.data.name}</CardTitle>
                  {sport.data.description ? (
                    <CardDescription>{sport.data.description}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="grid gap-4 xl:grid-cols-2">
                  {sport.data.modalities.map((modality) => {
                    const standingData = standings[standingsIndex]?.data ?? [];
                    standingsIndex += 1;

                    return (
                      <div key={modality.id} className="rounded-3xl border border-border/70 bg-muted/10 p-4">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                          <div className="font-medium">{modality.name}</div>
                          <Badge variant="outline">{modality.gender}</Badge>
                          {modality.category ? (
                            <Badge variant="secondary">{modality.category}</Badge>
                          ) : null}
                        </div>
                        <SportStandings entries={standingData} />
                      </div>
                    );
                  })}
                  {sport.data.modalities.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
                      Nenhuma modalidade disponível.
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
