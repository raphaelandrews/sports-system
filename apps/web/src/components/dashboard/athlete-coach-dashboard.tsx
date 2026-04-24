import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, CalendarDays, Medal, Trophy, UserRound } from "lucide-react";

import { Badge } from "@sports-system/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { formatDate, formatEventDate } from "@/lib/date";
import { allEventsQueryOptions } from "@/queries/events";
import { notificationsQueryOptions } from "@/queries/notifications";
import { competitionListQueryOptions } from "@/queries/competitions";
import type { Session } from "@/types/auth";
import type { MatchReminderPayload, ResultPayload } from "@/types/notifications";

import {
  ActionLink,
  DashboardShell,
  EmptyState,
  findCurrentCompetition,
  parseMatchReminderPayload,
  parseResultPayload,
  SectionHeader,
  StatCard,
  statusLabel,
} from "./dashboard-primitives";

export function AthleteCoachDashboard({
  session,
  leagueId,
}: {
  session: Session;
  leagueId: number;
}) {
  const { data: notifications } = useSuspenseQuery(notificationsQueryOptions(session.id));
  const { data: competitions } = useSuspenseQuery(competitionListQueryOptions(leagueId));
  const { data: events } = useSuspenseQuery(allEventsQueryOptions(leagueId, { per_page: 12 }));

  const currentCompetition = findCurrentCompetition(competitions.data);
  const upcomingMatches = notifications.data
    .map(parseMatchReminderPayload)
    .filter((payload): payload is MatchReminderPayload => Boolean(payload))
    .slice(0, 4);
  const recentResults = notifications.data
    .map(parseResultPayload)
    .filter((payload): payload is ResultPayload => Boolean(payload))
    .slice(0, 4);
  const nextEvents = events.data.slice(0, 3);

  return (
    <DashboardShell accent="from-violet-500/15 via-blue-500/10 to-transparent">
      <SectionHeader
        eyebrow="Painel do atleta"
        title={`Olá, ${session.name}`}
        description="Veja o que vem pela frente, acompanhe seus resultados recentes e navegue rápido para o calendário e para a página pública de resultados."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Competição atual"
          value={currentCompetition ? `#${currentCompetition.number}` : "—"}
          sub={
            currentCompetition ? statusLabel[currentCompetition.status] : "Nenhuma competição ativa"
          }
          icon={CalendarDays}
        />
        <StatCard
          title="Próximas partidas"
          value={upcomingMatches.length}
          sub="lembretes disponíveis para você"
          icon={Activity}
        />
        <StatCard
          title="Resultados recentes"
          value={recentResults.length}
          sub="atualizações publicadas recentemente"
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Minhas próximas partidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMatches.length === 0 ? (
              <EmptyState text="Ainda não há lembretes de partida para mostrar." />
            ) : (
              upcomingMatches.map((match) => (
                <div
                  key={match.match_id}
                  className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
                >
                  <div className="text-sm font-medium">{match.event_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatEventDate(match.start_time)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="h-4 w-4" />
              Meus resultados recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentResults.length === 0 ? (
              <EmptyState text="Nenhum resultado recente vinculado ao seu usuário." />
            ) : (
              recentResults.map((result) => (
                <div
                  key={result.match_id}
                  className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
                >
                  <div className="text-sm font-medium">{result.event_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Atualizado via central de resultados
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" />
              Atalhos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionLink to="/calendar" label="Abrir calendário da competição" />
            <ActionLink to="/results" label="Ver quadro de medalhas" />
            <ActionLink to="/sports" label="Explorar modalidades e esportes" />
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Agenda geral em destaque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextEvents.length === 0 ? (
              <EmptyState text="Nenhum evento destacado no calendário público." />
            ) : (
              nextEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium">{event.phase}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {event.venue ?? "Local a definir"}
                    </div>
                  </div>
                  <Badge variant="outline">{formatDate(event.event_date)}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
