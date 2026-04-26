import { useMemo, useState } from "react";
import { AlertCircleIcon, XIcon } from "lucide-react";

import { cn } from "@sports-system/ui/lib/utils";
import { roleLabel, type ShellScope } from "@/shared/components/layouts/shell-navigation";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";

type BarItem = {
  id: string;
  message: string;
  severity: "neutral" | "warning" | "error";
  dismissible?: boolean;
};

export function DashboardBottomBar({
  scope,
  session,
  league,
  membership,
  membershipError,
}: {
  scope: ShellScope;
  session: Session | null;
  league?: LeagueResponse;
  membership?: LeagueMemberResponse;
  membershipError: boolean;
}) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const items = useMemo<BarItem[]>(() => {
    const nextItems: BarItem[] = [];

    if (league) {
      nextItems.push({
        id: "league-context",
        severity: "neutral",
        message: membership
          ? `${roleLabel(membership.role)} em ${league.name} · ${league.timezone}`
          : `${league.name} · ${league.timezone}`,
      });
    } else if (session) {
      nextItems.push({
        id: "platform-context",
        severity: "neutral",
        message: `${roleLabel(session.role)} conectado · plataforma ativa`,
      });
    }

    if (!session && scope !== "site-public") {
      nextItems.push({
        id: "auth-required",
        severity: "warning",
        message: "Entre para acessar ações privadas e navegar pela sua área.",
      });
    }

    if (membershipError && league) {
      nextItems.push({
        id: "membership-error",
        severity: "error",
        message: "Contexto autenticado da liga indisponível. Navegação pública mantida.",
        dismissible: true,
      });
    }

    if (scope === "site-authenticated") {
      nextItems.push({
        id: "create-league",
        severity: "warning",
        message: "Crie uma liga nova ou entre em uma existente para liberar o modo competição.",
        dismissible: true,
      });
    }

    return nextItems;
  }, [league, membership, membershipError, scope, session]);

  const visibleItems = items.filter((item) => !dismissedIds.includes(item.id));

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="empty:hidden hidden flex-row flex-wrap items-start gap-1 px-2 pb-2 md:flex">
      {visibleItems.map((item) => {
        const isError = item.severity === "error";
        const isWarning = item.severity === "warning";

        return (
          <div
            key={item.id}
            className={cn(
              "flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-xs",
              isError
                ? "bg-red-500 text-white dark:bg-red-500 dark:text-white"
                : isWarning
                  ? "bg-yellow-500 text-yellow-950 dark:bg-yellow-500 dark:text-yellow-950"
                  : "bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground",
            )}
          >
            <AlertCircleIcon size={14} strokeWidth={2} className="shrink-0" />
            <span className="min-w-0 flex-1">{item.message}</span>
            {item.dismissible && (
              <button
                type="button"
                onClick={() => setDismissedIds((current) => [...current, item.id])}
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded transition-colors",
                  isError
                    ? "hover:bg-white/15"
                    : isWarning
                      ? "hover:bg-yellow-600/20"
                      : "hover:bg-background/70",
                )}
              >
                <XIcon size={12} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
