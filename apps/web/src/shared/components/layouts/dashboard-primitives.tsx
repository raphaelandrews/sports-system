import type { ElementType, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import type {
  MatchReminderPayload,
  NotificationResponse,
  ResultPayload,
} from "@/types/notifications";
import type { CompetitionResponse, CompetitionStatus } from "@/types/competitions";

export const statusLabel: Record<CompetitionStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  LOCKED: "Travada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
};

export function findCurrentCompetition(competitions: CompetitionResponse[]) {
  return (
    competitions.find((competition) => competition.status === "ACTIVE") ??
    competitions.find((competition) => competition.status === "LOCKED") ??
    competitions.find((competition) => competition.status === "SCHEDULED") ??
    competitions[0] ??
    null
  );
}

export function parseMatchReminderPayload(notification: NotificationResponse) {
  if (notification.notification_type !== "MATCH_REMINDER") return null;

  const payload = notification.payload as Partial<MatchReminderPayload>;

  if (
    typeof payload.match_id !== "number" ||
    typeof payload.event_name !== "string" ||
    typeof payload.start_time !== "string"
  ) {
    return null;
  }

  return payload;
}

export function parseResultPayload(notification: NotificationResponse) {
  if (notification.notification_type !== "RESULT") return null;

  const payload = notification.payload as Partial<ResultPayload>;

  if (typeof payload.match_id !== "number" || typeof payload.event_name !== "string") {
    return null;
  }

  return payload;
}

export function StatCard({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  sub: string;
  icon: ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/60 px-3.5 py-3 transition-colors hover:bg-muted">
      <div className="flex shrink-0 items-center justify-center text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold leading-tight tabular-nums">{value}</p>
        <p className="truncate text-xs text-muted-foreground">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground/80">{sub}</p>
      </div>
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
        {eyebrow}
      </div>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full overflow-auto px-6 py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="relative flex flex-col gap-8">{children}</div>
      </div>
    </div>
  );
}

export function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <a
      href={to}
      className="group flex items-center justify-between rounded-xl bg-muted/60 px-3.5 py-3 text-sm transition hover:bg-muted"
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
    </a>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
