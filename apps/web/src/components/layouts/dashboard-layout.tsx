import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";

import { ApiError } from "@/lib/api";
import { DashboardBottomBar } from "@/components/layouts/dashboard-bottombar";
import { DashboardContentLoading } from "@/components/layouts/dashboard-content-loading";
import { DashboardMobileNav } from "@/components/layouts/dashboard-mobile-nav";
import {
  SIDE_PANEL_WIDTH,
  SidePanelProvider,
  SidePanelSlot,
  SidePanelToggle,
  useSidePanelSlot,
} from "@/components/layouts/dashboard-side-panel";
import { DashboardTopbar } from "@/components/layouts/dashboard-topbar";
import {
  getLeagueIdFromPath,
  getShellScope,
  isMembershipFallbackError,
} from "@/components/layouts/shell-navigation";
import { leagueDetailQueryOptions, myLeagueMembershipQueryOptions } from "@/queries/leagues";
import type { Session } from "@/types/auth";

export function DashboardLayout({
  session,
  children,
}: {
  session: Session | null;
  children?: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const leagueId = getLeagueIdFromPath(pathname);
  const scope = getShellScope(pathname, session);
  const sidePanel = useSidePanelSlot();

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

  const showPanel = sidePanel.hasContent && !sidePanel.collapsed;

  return (
    <div className="isolate flex h-dvh flex-col bg-muted">
      <DashboardTopbar
        session={session}
        pathname={pathname}
        scope={scope}
        league={leagueQuery.data}
        membership={membership}
      />
      <SidePanelProvider
        value={{
          node: sidePanel.node,
          collapsed: sidePanel.collapsed,
          hasContent: sidePanel.hasContent,
          toggle: sidePanel.toggle,
        }}
      >
        <motion.div
          initial={false}
          animate={{
            gridTemplateColumns: showPanel
              ? `minmax(0, 1fr) ${SIDE_PANEL_WIDTH}px`
              : "minmax(0, 1fr) 0px",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="grid flex-1 overflow-hidden p-2 pt-0"
        >
          <div className="relative overflow-hidden rounded-xl border bg-card shadow-[0_1px_4px_0_rgba(0,0,0,0.03)]">
            <div className="h-full">
              <React.Suspense fallback={<DashboardContentLoading />}>{children}</React.Suspense>
            </div>
            <SidePanelToggle />
          </div>

          <SidePanelSlot
            slotRef={sidePanel.setNode}
            collapsed={sidePanel.collapsed}
            onHasContent={sidePanel.setHasContent}
          />
        </motion.div>
      </SidePanelProvider>
      <DashboardBottomBar
        scope={scope}
        session={session}
        league={leagueQuery.data}
        membership={membership}
        membershipError={membershipQuery.isError && !isMembershipFallbackError(membershipErrorStatus)}
      />
      <DashboardMobileNav
        session={session}
        scope={scope}
        league={leagueQuery.data}
        membership={membership}
      />
    </div>
  );
}
