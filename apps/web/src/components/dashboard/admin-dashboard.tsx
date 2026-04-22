import { useSuspenseQuery } from "@tanstack/react-query"
import { CalendarDays, ClipboardCheck, Flag, Sparkles, Target, Trophy, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card"
import { ActivityFeed } from "@/components/activity/activity-feed"
import { formatDate } from "@/lib/date"
import { activityFeedQueryOptions } from "@/queries/activities"
import { adminRequestsQueryOptions } from "@/queries/admin"
import { finalReportQueryOptions } from "@/queries/reports"
import { weekListQueryOptions } from "@/queries/weeks"

import {
  ActionLink,
  DashboardShell,
  EmptyState,
  findCurrentWeek,
  SectionHeader,
  StatCard,
  statusLabel,
} from "./dashboard-primitives"

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
                    <div className="bg-amber-400" style={{ width: `${goldShare}%` }} />
                    <div className="bg-slate-300" style={{ width: `${silverShare}%` }} />
                    <div className="bg-orange-700" style={{ width: `${bronzeShare}%` }} />
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
            <div
              key={sport.sport_id}
              className="grid gap-2 sm:grid-cols-[180px_1fr_48px] sm:items-center"
            >
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

export function AdminDashboard() {
  const { data: finalReport } = useSuspenseQuery(finalReportQueryOptions())
  const { data: weeks } = useSuspenseQuery(weekListQueryOptions())
  const { data: requests } = useSuspenseQuery(adminRequestsQueryOptions())
  const { data: activityFeed } = useSuspenseQuery(activityFeedQueryOptions(6))

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

      <ActivityFeed
        initialItems={activityFeed}
        limit={6}
        showMatchLink
        title="Pulso da competição"
      />
    </DashboardShell>
  )
}
