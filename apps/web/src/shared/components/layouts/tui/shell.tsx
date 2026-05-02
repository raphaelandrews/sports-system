import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { ApiError } from "@/shared/lib/api";
import { DashboardContentLoading } from "@/shared/components/layouts/dashboard-content-loading";
import {
  getLeagueIdFromPath,
  getShellScope,
  isMembershipFallbackError,
} from "@/shared/components/layouts/shell-navigation";
import {
  leagueDetailQueryOptions,
  myLeagueMembershipQueryOptions,
} from "@/features/leagues/api/queries";
import { NavCommandProvider } from "@/shared/components/layouts/nav-command";
import { useInterceptBrowserShortcuts } from "@/shared/hooks/use-intercept-browser-shortcuts";
import type { Session } from "@/types/auth";

interface TUIProps {
  session: Session | null;
  children?: React.ReactNode;
}

export function TUI({ session, children }: TUIProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const leagueId = getLeagueIdFromPath(pathname);
  const scope = getShellScope(pathname, session);

  const leagueQuery = useQuery({
    ...leagueDetailQueryOptions(leagueId ?? "0"),
    enabled: Boolean(leagueId),
  });

  const membershipQuery = useQuery({
    ...myLeagueMembershipQueryOptions(leagueId ?? "0"),
    enabled: Boolean(session && leagueId),
    retry: false,
  });

  const membershipErrorStatus =
    membershipQuery.error instanceof ApiError ? membershipQuery.error.status : undefined;
  const membership =
    membershipQuery.isError && isMembershipFallbackError(membershipErrorStatus)
      ? undefined
      : membershipQuery.data;

  useInterceptBrowserShortcuts(true);

  return (
    <NavCommandProvider
      session={session}
      scope={scope}
      league={leagueQuery.data}
      membership={membership}
    >
      <div className="h-svh flex flex-col bg-background overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <React.Suspense fallback={<DashboardContentLoading />}>
            {children}
          </React.Suspense>
        </main>
      </div>
    </NavCommandProvider>
  );
}
