import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { SidebarInset, SidebarProvider } from "@sports-system/ui/components/sidebar";
import { ApiError } from "@/shared/lib/api";
import { DashboardBottomBar } from "@/shared/components/layouts/dashboard-bottombar";
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
import type { Session } from "@/types/auth";

import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

export function NewLayout({
  session,
  children,
}: {
  session: Session | null;
  children?: React.ReactNode;
}) {
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

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader
          session={session}
          pathname={pathname}
          scope={scope}
          league={leagueQuery.data}
          membership={membership}
        />
        <div className="flex flex-1">
          <AppSidebar
            session={session}
            pathname={pathname}
            scope={scope}
            league={leagueQuery.data}
            membership={membership}
          />
          <SidebarInset>
            <div className="flex flex-1 flex-col gap-4 p-4">
              <React.Suspense fallback={<DashboardContentLoading />}>
                {children}
              </React.Suspense>
            </div>
            <DashboardBottomBar
              scope={scope}
              session={session}
              league={leagueQuery.data}
              membership={membership}
              membershipError={
                membershipQuery.isError && !isMembershipFallbackError(membershipErrorStatus)
              }
            />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
