import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Flag,
  Medal,
  ShieldAlert,
  Users,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { formatEventDate } from "@/shared/lib/date";
import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { enrollmentListQueryOptions } from "@/features/enrollments/api/queries";
import { notificationsQueryOptions } from "@/features/notifications/api/queries";
import { medalBoardQueryOptions } from "@/features/results/api/queries";
import type { Session } from "@/types/auth";
import type { MatchReminderPayload } from "@/types/notifications";

import {
  ActionLink,
  DashboardShell,
  EmptyState,
  parseMatchReminderPayload,
  SectionHeader,
  StatCard,
} from "@/shared/components/layouts/dashboard-primitives";

function StatusBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  const width = Math.min(value * 12, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/60">
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${Math.max(width, value > 0 ? 10 : 0)}%` }}
        />
      </div>
    </div>
  );
}

export function ChiefDashboard({ session, leagueId }: { session: Session; leagueId: number }) {
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions(leagueId));
  const { data: athletes } = useSuspenseQuery(athleteListQueryOptions(leagueId, { per_page: 100 }));
  const { data: enrollments } = useSuspenseQuery(enrollmentListQueryOptions(leagueId));
  const { data: medalBoard } = useSuspenseQuery(medalBoardQueryOptions(leagueId));
  const { data: notifications } = useSuspenseQuery(notificationsQueryOptions(session.id));

  const myDelegation =
    delegations.data.find((delegation) => delegation.chief_id === session.id) ?? null;
  const myMedalEntry = myDelegation
    ? (medalBoard.find((entry) => entry.delegation_id === myDelegation.id) ?? null)
    : null;
  const rank = myMedalEntry
    ? medalBoard.findIndex((entry) => entry.delegation_id === myMedalEntry.delegation_id) + 1
    : null;

  const upcomingMatches = notifications.data
    .map(parseMatchReminderPayload)
    .filter((payload): payload is MatchReminderPayload => Boolean(payload))
    .slice(0, 4);

  const unreadNotices = notifications.data.filter((notification) => !notification.read).slice(0, 5);
  const pendingEnrollments = enrollments.data.filter((item) => item.status === "PENDING").length;
  const approvedEnrollments = enrollments.data.filter((item) => item.status === "APPROVED").length;
  const rejectedEnrollments = enrollments.data.filter((item) => item.status === "REJECTED").length;

  return (
    <DashboardShell accent="from-sky-500/25 via-teal-400/15 to-transparent">
      <SectionHeader
        eyebrow="Minha delegação"
        title={myDelegation ? myDelegation.name : "Painel do chefe"}
        description="Monitore o ritmo da sua delegação, o fluxo de inscrições e os avisos que pedem ação antes do próximo ciclo de competição."
      />

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Delegação"
          value={myDelegation?.code ?? "—"}
          sub={myDelegation ? myDelegation.name : "Delegação ainda não vinculada"}
          icon={Flag}
        />
        <StatCard
          title="Atletas"
          value={athletes.meta.total}
          sub="vinculados à sua delegação"
          icon={Users}
        />
        <StatCard
          title="Inscrições"
          value={approvedEnrollments}
          sub={`${pendingEnrollments} pendentes · ${rejectedEnrollments} rejeitadas`}
          icon={ClipboardCheck}
        />
        <StatCard
          title="Posição"
          value={rank ? `${rank}º` : "—"}
          sub={myMedalEntry ? `${myMedalEntry.total} medalhas no total` : "Sem posição no quadro"}
          icon={Medal}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Próximos alertas</h2>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />
                Próximas partidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMatches.length === 0 ? (
                <EmptyState text="Nenhum lembrete de partida disponível no momento." />
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
                <ShieldAlert className="h-4 w-4" />
                Avisos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unreadNotices.length === 0 ? (
                <EmptyState text="Sem avisos não lidos no momento." />
              ) : (
                unreadNotices.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3"
                  >
                    <div className="text-sm font-medium">
                      {notification.notification_type === "MATCH_REMINDER"
                        ? "Lembrete de partida"
                        : notification.notification_type === "RESULT"
                          ? "Resultado publicado"
                          : "Atualização da competição"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatEventDate(notification.created_at)}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Ações da delegação</h2>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Status das inscrições
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBar label="Aprovadas" value={approvedEnrollments} tone="bg-emerald-500" />
              <StatusBar label="Pendentes" value={pendingEnrollments} tone="bg-amber-500" />
              <StatusBar label="Rejeitadas" value={rejectedEnrollments} tone="bg-rose-500" />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/85 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowRight className="h-4 w-4" />
                Atalhos rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ActionLink to="/dashboard/my-delegation" label="Abrir visão geral da delegação" />
              <ActionLink to="/dashboard/my-delegation/members" label="Ver membros e convites" />
              <ActionLink to="/dashboard/enrollments" label="Acompanhar inscrições" />
              <ActionLink to="/results" label="Comparar posição no quadro de medalhas" />
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardShell>
  );
}
