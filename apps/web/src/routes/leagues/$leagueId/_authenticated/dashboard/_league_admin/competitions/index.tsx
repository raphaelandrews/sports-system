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

import * as m from "@/paraglide/messages";
import { formatDate } from "@/shared/lib/date";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import type { CompetitionStatus } from "@/types/competitions";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_league_admin/competitions/",
)({
  ssr: false,
  loader: ({ context: { queryClient }, params: { leagueId } }) => {
    void queryClient.prefetchQuery(competitionListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(sportListQueryOptions());
  },
  component: AdminCompetitionsPage,
});

const statusLabel: Record<CompetitionStatus, string> = {
  DRAFT: m['common.status.draft'](),
  SCHEDULED: m['common.status.scheduled'](),
  LOCKED: m['common.status.locked'](),
  ACTIVE: m['common.status.active'](),
  COMPLETED: m['common.status.completed'](),
};

function AdminCompetitionsPage() {
  const { leagueId } = Route.useParams();
  const { data: competitions } = useSuspenseQuery(competitionListQueryOptions(Number(leagueId)));
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
              {m['competitions.admin.title']()}
            </Badge>
            <CardTitle className="text-2xl">{m['competitions.admin.title']()}</CardTitle>
            <CardDescription className="max-w-2xl">
              {m['competitions.admin.card.transfer.desc']()}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <MetricCard
              label={m['competitions.admin.stat.total']()}
              value={String(competitions.data.length)}
              hint="Competições cadastradas"
            />
            <MetricCard
              label={m['competitions.admin.stat.active']()}
              value={String(competitions.data.filter((c) => c.status === "ACTIVE").length)}
              hint="Competição em andamento"
            />
            <MetricCard
              label={m['competitions.admin.stat.locked']()}
              value={String(
                competitions.data.filter((c) =>
                  ["LOCKED", "ACTIVE", "COMPLETED"].includes(c.status),
                ).length,
              )}
              hint="Fora da edição livre"
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>{m['competitions.admin.card.transfer.title']()}</CardTitle>
            <CardDescription>{m['competitions.admin.card.transfer.desc']()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={transferInfo.open ? "secondary" : "outline"}>
              {transferInfo.open ? m['chief.shell.badge.open']() : m['chief.shell.badge.closed']()}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {transferInfo.open
                ? m['transferWindow.openMessage']()
                : `Próxima janela: ${transferInfo.nextLabel}.`}
            </p>
            <Link
              to="/leagues/$leagueId/dashboard/competitions/new"
              params={{ leagueId }}
              className={cn(buttonVariants({ variant: "default" }), "w-full justify-start")}
            >
              {m['competition.form.title']()}
            </Link>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>{m['competitions.admin.card.list.title']()}</CardTitle>
          <CardDescription>
            Veja período, status e esportes foco antes de abrir o detalhe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m['competitions.admin.table.competition']()}</TableHead>
                <TableHead>{m['competitions.admin.table.period']()}</TableHead>
                <TableHead>{m['competitions.admin.table.status']()}</TableHead>
                <TableHead>{m['competitions.admin.table.sports']()}</TableHead>
                <TableHead className="text-right">{m['competitions.admin.table.actions']()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitions.data.map((competition) => (
                <TableRow key={competition.id}>
                  <TableCell className="font-medium">#{competition.number}</TableCell>
                  <TableCell>
                    {formatDate(competition.start_date)} até {formatDate(competition.end_date)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={competition.status === "ACTIVE" ? "secondary" : "outline"}>
                      {statusLabel[competition.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {competition.sport_focus.length > 0
                      ? competition.sport_focus
                          .filter((sportId): sportId is number => typeof sportId === "number")
                          .map((sportId) => sportNamesById.get(sportId) ?? `#${sportId}`)
                          .join(", ")
                      : "Sem foco definido"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      to="/leagues/$leagueId/dashboard/competitions/$competitionId"
                      params={{ leagueId, competitionId: String(competition.id) }}
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      {m['common.actions.open']()}
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
