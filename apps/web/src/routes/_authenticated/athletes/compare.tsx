import { type ReactNode, useMemo } from "react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, Medal, Swords, Trophy, Users } from "lucide-react";
import { z } from "zod";
import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
import { Badge } from "@sports-system/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@sports-system/ui/components/table";

import { formatDate } from "@/lib/date";
import { athleteListQueryOptions, athleteReportQueryOptions } from "@/queries/athletes";
import type { AthleteReportResponse, Medal as MedalType } from "@/types/athletes";

const compareSearchSchema = z.object({
  left: z.coerce.number().optional(),
  right: z.coerce.number().optional(),
});

const medalLabel: Record<MedalType, string> = {
  GOLD: "Ouro",
  SILVER: "Prata",
  BRONZE: "Bronze",
};

export const Route = createFileRoute("/_authenticated/athletes/compare")({
  validateSearch: compareSearchSchema,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(athleteListQueryOptions({ per_page: 500 }));
  },
  component: AthleteComparePage,
});

function AthleteComparePage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { data: athleteList } = useSuspenseQuery(athleteListQueryOptions({ per_page: 500 }));

  const leftQuery = useQuery({
    ...athleteReportQueryOptions(search.left ?? 0),
    enabled: Boolean(search.left),
  });
  const rightQuery = useQuery({
    ...athleteReportQueryOptions(search.right ?? 0),
    enabled: Boolean(search.right),
  });

  const leftReport = leftQuery.data ?? null;
  const rightReport = rightQuery.data ?? null;

  const allMetricRows = useMemo(
    () => buildMetricRows(leftReport, rightReport),
    [leftReport, rightReport],
  );

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_40%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Head-to-head</Badge>
              <Badge variant="secondary">Comparação de atletas</Badge>
            </div>
            <CardTitle className="text-3xl">Tela side-by-side para confronto de desempenho</CardTitle>
            <CardDescription className="max-w-2xl">
              Compare duas fichas de atleta usando histórico, medalhas e estatísticas agregadas da competição.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <QuickMetric label="Atletas disponíveis" value={String(athleteList.data.length)} />
            <QuickMetric label="Comparação ativa" value={leftReport && rightReport ? "2 perfis" : "incompleta"} />
            <QuickMetric label="Critérios" value="histórico · medalhas · stats" />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Seleção</CardTitle>
            <CardDescription>
              Escolha os dois atletas e a rota mantém o pareamento na URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AthleteSelector
              label="Atleta A"
              value={search.left ? String(search.left) : ""}
              athletes={athleteList.data}
              onChange={(value) =>
                navigate({
                  to: "/athletes/compare",
                  search: { ...search, left: value ? Number(value) : undefined },
                })
              }
            />
            <AthleteSelector
              label="Atleta B"
              value={search.right ? String(search.right) : ""}
              athletes={athleteList.data}
              onChange={(value) =>
                navigate({
                  to: "/athletes/compare",
                  search: { ...search, right: value ? Number(value) : undefined },
                })
              }
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_auto_1fr] xl:items-start">
        <AthletePanel report={leftReport} side="Atleta A" />
        <div className="hidden xl:flex h-full items-center justify-center">
          <div className="rounded-full border border-border/70 bg-background/80 p-5">
            <Swords className="size-6 text-muted-foreground" />
          </div>
        </div>
        <AthletePanel report={rightReport} side="Atleta B" />
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-4" />
            Comparativo consolidado
          </CardTitle>
          <CardDescription>
            Leitura paralela dos indicadores principais e estatísticas numéricas agregadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leftReport && rightReport ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{leftReport.athlete.name}</TableHead>
                  <TableHead>Indicador</TableHead>
                  <TableHead className="text-right">{rightReport.athlete.name}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMetricRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className={row.leftBetter ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {row.left}
                    </TableCell>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className={`text-right ${row.rightBetter ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {row.right}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
              Selecione dois atletas para abrir o comparativo side-by-side.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AthleteSelector({
  label,
  value,
  athletes,
  onChange,
}: {
  label: string;
  value: string;
  athletes: { id: number; name: string; code: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um atleta" />
        </SelectTrigger>
        <SelectContent>
          {athletes.map((athlete) => (
            <SelectItem key={athlete.id} value={String(athlete.id)}>
              {athlete.name} · {athlete.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function AthletePanel({
  report,
  side,
}: {
  report: AthleteReportResponse | null;
  side: string;
}) {
  if (!report) {
    return (
      <Card className="border border-dashed border-border/70">
        <CardContent className="flex min-h-72 items-center justify-center p-8 text-sm text-muted-foreground">
          {side}: selecione um atleta.
        </CardContent>
      </Card>
    );
  }

  const snapshot = buildSnapshot(report);
  const initials = report.athlete.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <Card className="border border-border/70">
      <CardHeader className="gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 text-lg">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{side}</Badge>
              <Badge variant="secondary" className="font-mono">{report.athlete.code}</Badge>
            </div>
            <CardTitle className="mt-2 text-2xl">{report.athlete.name}</CardTitle>
            <CardDescription>
              {report.athlete.birthdate ? formatDate(report.athlete.birthdate) : "Nascimento não informado"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <MiniStat icon={<Trophy className="size-4" />} label="Medalhas" value={String(snapshot.totalMedals)} />
          <MiniStat icon={<Users className="size-4" />} label="Delegações" value={String(snapshot.delegationCount)} />
          <MiniStat icon={<ArrowLeftRight className="size-4" />} label="Partidas" value={String(snapshot.totalMatches)} />
          <MiniStat icon={<Medal className="size-4" />} label="Esportes" value={String(snapshot.sportCount)} />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Medalhas</div>
          {report.medals.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {report.medals.map((medal) => (
                <Badge key={medal.id} variant="outline">
                  {medal.medal ? medalLabel[medal.medal] : "Sem medalha"} · {medal.rank}º
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma medalha registrada.</div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium">Modalidades recentes</div>
          {report.match_history.length > 0 ? (
            <div className="space-y-2">
              {report.match_history.slice(0, 5).map((item) => (
                <div key={`${item.match_id}-${item.role}`} className="rounded-2xl border border-border/70 bg-muted/10 p-3">
                  <div className="font-medium">{item.modality_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.sport_name} · {item.role} · {item.match_date ? formatDate(item.match_date.slice(0, 10)) : "sem data"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Sem histórico de partidas.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function QuickMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}

function buildSnapshot(report: AthleteReportResponse) {
  const gold = report.medals.filter((item) => item.medal === "GOLD").length;
  const silver = report.medals.filter((item) => item.medal === "SILVER").length;
  const bronze = report.medals.filter((item) => item.medal === "BRONZE").length;
  const delegationCount = new Set(report.delegation_history.map((item) => item.delegation_id)).size;
  const sportCount = new Set(report.match_history.map((item) => item.sport_name)).size;
  const modalityCount = new Set(report.match_history.map((item) => item.modality_name)).size;
  const numericStatistics = aggregateNumericStatistics(report.statistics);

  return {
    totalMatches: report.match_history.length,
    delegationCount,
    sportCount,
    modalityCount,
    totalMedals: report.medals.length,
    gold,
    silver,
    bronze,
    numericStatistics,
  };
}

function aggregateNumericStatistics(statistics: Record<string, unknown>) {
  const result = new Map<string, number>();

  for (const value of Object.values(statistics)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (typeof nestedValue === "number") {
        result.set(key, (result.get(key) ?? 0) + nestedValue);
      }
    }
  }

  return result;
}

function buildMetricRows(left: AthleteReportResponse | null, right: AthleteReportResponse | null) {
  if (!left || !right) {
    return [];
  }

  const leftSnapshot = buildSnapshot(left);
  const rightSnapshot = buildSnapshot(right);

  const rows = [
    makeMetricRow("Partidas", leftSnapshot.totalMatches, rightSnapshot.totalMatches),
    makeMetricRow("Medalhas totais", leftSnapshot.totalMedals, rightSnapshot.totalMedals),
    makeMetricRow("Ouros", leftSnapshot.gold, rightSnapshot.gold),
    makeMetricRow("Pratas", leftSnapshot.silver, rightSnapshot.silver),
    makeMetricRow("Bronzes", leftSnapshot.bronze, rightSnapshot.bronze),
    makeMetricRow("Delegações", leftSnapshot.delegationCount, rightSnapshot.delegationCount),
    makeMetricRow("Esportes", leftSnapshot.sportCount, rightSnapshot.sportCount),
    makeMetricRow("Modalidades", leftSnapshot.modalityCount, rightSnapshot.modalityCount),
  ];

  const numericKeys = [...new Set([
    ...leftSnapshot.numericStatistics.keys(),
    ...rightSnapshot.numericStatistics.keys(),
  ])]
    .sort()
    .slice(0, 8);

  for (const key of numericKeys) {
    rows.push(
      makeMetricRow(
        key.replace(/_/g, " "),
        leftSnapshot.numericStatistics.get(key) ?? 0,
        rightSnapshot.numericStatistics.get(key) ?? 0,
      ),
    );
  }

  return rows;
}

function makeMetricRow(label: string, left: number, right: number) {
  return {
    label,
    left,
    right,
    leftBetter: left > right,
    rightBetter: right > left,
  };
}
