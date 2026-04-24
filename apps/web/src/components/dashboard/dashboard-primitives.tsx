import type { ElementType, ReactNode } from "react"
import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card"
import type {
  MatchReminderPayload,
  NotificationResponse,
  ResultPayload,
} from "@/types/notifications"
import type { CompetitionResponse, CompetitionStatus } from "@/types/competitions"

export const statusLabel: Record<CompetitionStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  LOCKED: "Travada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
}

export function findCurrentCompetition(competitions: CompetitionResponse[]) {
  return (
    competitions.find((competition) => competition.status === "ACTIVE") ??
    competitions.find((competition) => competition.status === "LOCKED") ??
    competitions.find((competition) => competition.status === "SCHEDULED") ??
    competitions[0] ??
    null
  )
}

export function parseMatchReminderPayload(notification: NotificationResponse) {
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

export function parseResultPayload(notification: NotificationResponse) {
  if (notification.notification_type !== "RESULT") return null

  const payload = notification.payload as Partial<ResultPayload>

  if (typeof payload.match_id !== "number" || typeof payload.event_name !== "string") {
    return null
  }

  return payload
}

export function StatCard({
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
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )
}

export function SectionHeader({
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

export function DashboardShell({
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

export function ActionLink({ to, label }: { to: string; label: string }) {
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

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>
}
