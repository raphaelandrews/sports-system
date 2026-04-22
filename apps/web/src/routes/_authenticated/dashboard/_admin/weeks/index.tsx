import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { cn } from "@sports-system/ui/lib/utils";

import { formatDate } from "@/lib/date";
import { sportListQueryOptions } from "@/queries/sports";
import { weekListQueryOptions } from "@/queries/weeks";
import type { WeekStatus } from "@/types/weeks";

export const Route = createFileRoute("/_authenticated/dashboard/_admin/weeks/")({
  ssr: false,
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(weekListQueryOptions())
    void queryClient.prefetchQuery(sportListQueryOptions())
  },
  component: AdminWeeksPage,
});

const statusLabel: Record<WeekStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  LOCKED: "Travada",
  ACTIVE: "Ativa",
  COMPLETED: "Encerrada",
};

function AdminWeeksPage() {
  const { data: weeks } = useSuspenseQuery(weekListQueryOptions());
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  const sportNamesById = useMemo(
    () => new Map(sports.data.map((sport) => [sport.id, sport.name])),
    [sports.data],
  );

  const transferInfo = getTransferWindowInfo();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <Badge variant="outline" className="w-fit">
              Fase 9
            </Badge>
            <CardTitle className="text-2xl">Semanas de competicao</CardTitle>
            <CardDescription className="max-w-2xl">
              Gerencie o ciclo da semana, acompanhe status visual e entre no detalhe para acionar transições.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total" value={String(weeks.data.length)} hint="Semanas cadastradas" />
            <MetricCard
              label="Ativas"
              value={String(weeks.data.filter((week) => week.status === "ACTIVE").length)}
              hint="Competicao em andamento"
            />
            <MetricCard
              label="Travadas+"
              value={String(
                weeks.data.filter((week) => ["LOCKED", "ACTIVE", "COMPLETED"].includes(week.status)).length,
              )}
              hint="Fora da edicao livre"
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Janela de transferência</CardTitle>
            <CardDescription>
              Regras calculadas em UTC-3 / America_Sao_Paulo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={transferInfo.open ? "secondary" : "outline"}>
              {transferInfo.open ? "Janela aberta" : "Janela fechada"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {transferInfo.open
                ? "Transferencias liberadas hoje."
                : `Proxima janela: ${transferInfo.nextLabel}.`}
            </p>
            <Link
              to="/dashboard/weeks/new"
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
            >
              Nova semana
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Lista das semanas</CardTitle>
          <CardDescription>
            Veja período, status e esportes foco antes de abrir o detalhe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Semana</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Esportes foco</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.data.map((week) => (
                <TableRow key={week.id}>
                  <TableCell className="font-medium">#{week.week_number}</TableCell>
                  <TableCell>
                    {formatDate(week.start_date)} até {formatDate(week.end_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={week.status === "ACTIVE" ? "secondary" : "outline"}>
                      {statusLabel[week.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {week.sport_focus.length > 0
                      ? week.sport_focus
                          .map((sportId) => sportNamesById.get(sportId) ?? `#${sportId}`)
                          .join(", ")
                      : "Sem foco definido"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/dashboard/weeks/$weekId"
                      params={{ weekId: String(week.id) }}
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      Abrir detalhe
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
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
