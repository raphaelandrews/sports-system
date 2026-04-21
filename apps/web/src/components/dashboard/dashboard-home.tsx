import type { ElementType, ReactNode } from "react"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Flag,
  Medal,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Users,
} from "lucide-react"

import { Badge } from "@sports-system/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card"
import { formatDate, formatEventDate } from "@/lib/date"
import { adminRequestsQueryOptions } from "@/queries/admin"
import { athleteListQueryOptions } from "@/queries/athletes"
import { delegationListQueryOptions } from "@/queries/delegations"
import { enrollmentListQueryOptions } from "@/queries/enrollments"
import { allEventsQueryOptions } from "@/queries/events"
import { notificationsQueryOptions } from "@/queries/notifications"
import { finalReportQueryOptions } from "@/queries/reports"
import { medalBoardQueryOptions } from "@/queries/results"
import { weekListQueryOptions } from "@/queries/weeks"
import type {
  MatchReminderPayload,
  NotificationResponse,
  ResultPayload,
} from "@/types/notifications"
import type { Session } from "@/types/auth"
import type { WeekResponse, WeekStatus } from "@/types/weeks"

const statusLabel: Record<WeekStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  LOCKED: "Travada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string
  value: string | number
  sub: string
  icon: ElementType
}) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </div>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function findCurrentWeek(weeks: WeekResponse[]) {
  return (
    weeks.find((week) => week.status === "ACTIVE") ??
    weeks.find((week) => week.status === "LOCKED") ??
    weeks.find((week) => week.status === "SCHEDULED") ??
    weeks[0] ??
    null
  )
}

function parseMatchReminderPayload(notification: NotificationResponse) {
  if (notification.notification_type !== "MATCH_REMINDER") return null

  const payload = notification.payload as Partial<MatchReminderPayload>

  if (
    typeof payload.match_id !== "number" ||
    typeof payload.event_name !== "string" ||
    typeof payload.start_time !== "string"
  ) {
    return null
  }

  return payload
}

function parseResultPayload(notification: NotificationResponse) {
  if (notification.notification_type !== "RESULT") return null

  const payload = notification.payload as Partial<ResultPayload>

  if (typeof payload.match_id !== "number" || typeof payload.event_name !== "string") {
    return null
  }

  return payload
}

function DashboardShell({
  accent,
  children,
}: {
  accent: string
  children: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/60 bg-background">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-r ${accent} opacity-75 blur-3xl`}
      />
      <div className="relative space-y-6 p-6">{children}</div>
    </div>
  )
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <a
      href={to}
      className="group flex items-center justify-between rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm transition hover:border-foreground/20 hover:bg-accent/40"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
    </a>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>
}

function AdminDashboard() {
  const { data: finalReport } = useSuspenseQuery(finalReportQueryOptions())
  const { data: weeks } = useSuspenseQuery(weekListQueryOptions())
  const { data: requests } = useSuspenseQuery(adminRequestsQueryOptions())

  const currentWeek = findCurrentWeek(weeks.data)
  const pendingRequests = requests.data.filter((request) => request.status === "PENDING")
  const completionRate =
    finalReport.summary.total_matches > 0
      ? Math.round(
          (finalReport.summary.completed_matches / finalReport.summary.total_matches) * 100,
        )
      : 0

  return (
    <DashboardShell accent="from-amber-500/30 via-orange-500/15 to-transparent">
      <SectionHeader
        eyebrow="Centro de comando"
        title="Dashboard administrativo"
        description="Acompanhe o estado da competição, a saúde da operação e os atalhos de geração para acelerar o setup das próximas etapas."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Delegações"
          value={finalReport.summary.total_delegations}
          sub="delegações ativas na competição"
          icon={Flag}
        />
        <StatCard
          title="Atletas"
          value={finalReport.summary.total_athletes}
          sub="cadastros ativos no sistema"
          icon={Users}
        />
        <StatCard
          title="Semana"
          value={currentWeek ? `#${currentWeek.week_number}` : "—"}
          sub={
            currentWeek
              ? `${statusLabel[currentWeek.status]} · ${formatDate(currentWeek.start_date)}`
              : "Nenhuma semana criada"
          }
          icon={CalendarDays}
        />
        <StatCard
          title="Solicitações"
          value={pendingRequests.length}
          sub="chefes aguardando revisão"
          icon={ClipboardCheck}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <MedalProgressCard />
        <GaugeCard
          value={completionRate}
          title="Taxa de partidas concluídas"
          description={`${finalReport.summary.completed_matches} de ${finalReport.summary.total_matches} partidas já encerradas.`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AthletesBySportCard />
        <Card className="border-border/70 bg-card/85 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              Atalhos de IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionLink to="/dashboard/ai" label="Abrir painel central de geração" />
            <ActionLink to="/dashboard/delegations" label="Gerar delegações com IA" />
            <ActionLink to="/dashboard/results" label="Gerar resultados assistidos" />
            <ActionLink to="/dashboard/reports" label="Revisar relatórios e exportações" />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

function MedalProgressCard() {
  const { data: finalReport } = useSuspenseQuery(finalReportQueryOptions())
  const leaders = finalReport.medal_board.slice(0, 5)
  const maxTotal = leaders[0]?.total ?? 1

  return (
    <Card className="border-border/70 bg-card/85 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          Progressão do quadro de medalhas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {leaders.length === 0 ? (
          <EmptyState text="O quadro de medalhas ainda não tem entradas para exibir." />
        ) : (
          leaders.map((entry) => {
            const totalShare = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0
            const goldShare = entry.total > 0 ? (entry.gold / entry.total) * 100 : 0
            const silverShare = entry.total > 0 ? (entry.silver / entry.total) * 100 : 0
            const bronzeShare = entry.total > 0 ? (entry.bronze / entry.total) * 100 : 0

            return (
              <div key={entry.delegation_id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{entry.delegation_name}</div>
                    <div className="text-xs text-muted-foreground">{entry.delegation_code}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>{entry.total} medalhas</div>
                    <div>
                      {entry.gold}G · {entry.silver}S · {entry.bronze}B
                    </div>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-muted/60">
                  <div
                    className="flex h-full overflow-hidden rounded-full"
                    style={{ width: `${Math.max(totalShare, 8)}%` }}
                  >
                    <div
                      className="bg-amber-400"
                      style={{ width: `${goldShare}%` }}
                    />
                    <div
                      className="bg-slate-300"
                      style={{ width: `${silverShare}%` }}
                    />
                    <div
                      className="bg-orange-700"
                      style={{ width: `${bronzeShare}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function AthletesBySportCard() {
  const { data: finalReport } = useSuspenseQuery(finalReportQueryOptions())
  const sports = finalReport.athletes_by_sport.slice(0, 8)
  const maxCount = Math.max(...sports.map((sport) => sport.athlete_count), 1)

  return (
    <Card className="border-border/70 bg-card/85 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          Atletas por esporte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sports.length === 0 ? (
          <EmptyState text="Ainda não há vínculos de atletas com modalidades esportivas." />
        ) : (
          sports.map((sport) => (
            <div key={sport.sport_id} className="grid gap-2 sm:grid-cols-[180px_1fr_48px] sm:items-center">
              <div className="text-sm font-medium">{sport.sport_name}</div>
              <div className="h-3 rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-linear-to-r from-sky-500 via-cyan-400 to-teal-300"
                  style={{ width: `${(sport.athlete_count / maxCount) * 100}%` }}
                />
              </div>
              <div className="text-right text-sm tabular-nums text-muted-foreground">
                {sport.athlete_count}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function GaugeCard({
  value,
  title,
  description,
}: {
  value: number
  title: string
  description: string
}) {
  return (
    <Card className="border-border/70 bg-card/85 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        <div
          className="grid h-40 w-40 place-items-center rounded-full border border-border/70"
          style={{
            background: `conic-gradient(hsl(var(--foreground)) ${value}%, hsl(var(--muted)) 0)`,
          }}
        >
          <div className="grid h-28 w-28 place-items-center rounded-full bg-background">
            <div className="text-center">
              <div className="text-3xl font-semibold">{value}%</div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                concluído
              </div>
            </div>
          </div>
        </div>
        <p className="max-w-xs text-center text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ChiefDashboard({ session }: { session: Session }) {
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions())
  const { data: athletes } = useSuspenseQuery(athleteListQueryOptions({ per_page: 100 }))
  const { data: enrollments } = useSuspenseQuery(enrollmentListQueryOptions())
  const { data: medalBoard } = useSuspenseQuery(medalBoardQueryOptions())
  const { data: notifications } = useSuspenseQuery(notificationsQueryOptions(session.id))

  const myDelegation = delegations.data.find((delegation) => delegation.chief_id === session.id) ?? null
  const myMedalEntry = myDelegation
    ? medalBoard.find((entry) => entry.delegation_id === myDelegation.id) ?? null
    : null
  const rank = myMedalEntry
    ? medalBoard.findIndex((entry) => entry.delegation_id === myMedalEntry.delegation_id) + 1
    : null

  const upcomingMatches = notifications.data
    .map(parseMatchReminderPayload)
    .filter((payload): payload is MatchReminderPayload => Boolean(payload))
    .slice(0, 4)

  const unreadNotices = notifications.data.filter((notification) => !notification.read).slice(0, 5)
  const pendingEnrollments = enrollments.data.filter((item) => item.status === "PENDING").length
  const approvedEnrollments = enrollments.data.filter((item) => item.status === "APPROVED").length
  const rejectedEnrollments = enrollments.data.filter((item) => item.status === "REJECTED").length

  return (
    <DashboardShell accent="from-sky-500/25 via-teal-400/15 to-transparent">
      <SectionHeader
        eyebrow="Minha delegação"
        title={myDelegation ? myDelegation.name : "Painel do chefe"}
        description="Monitore o ritmo da sua delegação, o fluxo de inscrições e os avisos que pedem ação antes do próximo ciclo de competição."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
    </DashboardShell>
  )
}

function StatusBar({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  const width = Math.min(value * 12, 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/60">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(width, value > 0 ? 10 : 0)}%` }} />
      </div>
    </div>
  )
}

function AthleteCoachDashboard({ session }: { session: Session }) {
  const { data: notifications } = useSuspenseQuery(notificationsQueryOptions(session.id))
  const { data: weeks } = useSuspenseQuery(weekListQueryOptions())
  const { data: events } = useSuspenseQuery(allEventsQueryOptions({ per_page: 12 }))

  const currentWeek = findCurrentWeek(weeks.data)
  const upcomingMatches = notifications.data
    .map(parseMatchReminderPayload)
    .filter((payload): payload is MatchReminderPayload => Boolean(payload))
    .slice(0, 4)
  const recentResults = notifications.data
    .map(parseResultPayload)
    .filter((payload): payload is ResultPayload => Boolean(payload))
    .slice(0, 4)
  const nextEvents = events.data.slice(0, 3)

  return (
    <DashboardShell accent="from-violet-500/15 via-blue-500/10 to-transparent">
      <SectionHeader
        eyebrow={session.role === "COACH" ? "Painel do técnico" : "Painel do atleta"}
        title={`Olá, ${session.name}`}
        description="Veja o que vem pela frente, acompanhe seus resultados recentes e navegue rápido para o calendário e para a página pública de resultados."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Semana atual"
          value={currentWeek ? `#${currentWeek.week_number}` : "—"}
          sub={currentWeek ? statusLabel[currentWeek.status] : "Nenhuma semana ativa"}
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
  )
}

export function DashboardHome({ session }: { session: Session }) {
  if (session.role === "ADMIN") return <AdminDashboard />
  if (session.role === "CHIEF") return <ChiefDashboard session={session} />
  return <AthleteCoachDashboard session={session} />
}
