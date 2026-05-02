import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { ApiError } from "@/shared/lib/api";
import { TerminalStatusBar } from "@/shared/components/layouts/terminal-status-bar";
import { DashboardContentLoading } from "@/shared/components/layouts/dashboard-content-loading";
import {
	getLeagueIdFromPath,
	getShellScope,
	isMembershipFallbackError,
} from "@/shared/components/layouts/shell-navigation";
import {
	leagueDetailQueryOptions,
	leagueListQueryOptions,
	myLeagueMembershipQueryOptions,
} from "@/features/leagues/api/queries";
import type { Session } from "@/types/auth";

import { TerminalHeader } from "./terminal-header";
import { TerminalSidebar } from "./terminal-sidebar";
import { NavCommandProvider } from "@/shared/components/layouts/nav-command";

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

	const leagueQuery = useQuery({
		...leagueDetailQueryOptions(leagueId ?? "0"),
		enabled: Boolean(leagueId),
	});

	const membershipQuery = useQuery({
		...myLeagueMembershipQueryOptions(leagueId ?? "0"),
		enabled: Boolean(session && leagueId),
		retry: false,
	});

	const allLeaguesQuery = useQuery({
		...leagueListQueryOptions(),
	});

	const leagues = allLeaguesQuery.data ?? [];

	const membershipErrorStatus =
		membershipQuery.error instanceof ApiError ? membershipQuery.error.status : undefined;
	const membership =
		membershipQuery.isError && isMembershipFallbackError(membershipErrorStatus)
			? undefined
			: membershipQuery.data;

	return (
		<NavCommandProvider
			session={session}
			scope={scope}
			league={leagueQuery.data}
			membership={membership}
		>
			<div className="h-svh flex flex-col bg-background text-foreground font-mono overflow-hidden">
				<TerminalHeader
					session={session}
					pathname={pathname}
					scope={scope}
					league={leagueQuery.data}
					membership={membership}
					leagues={leagues}
				/>
				<div className="flex flex-1 overflow-hidden">
				<TerminalSidebar
					session={session}
					pathname={pathname}
					scope={scope}
					league={leagueQuery.data}
					membership={membership}
				/>
				<div className="flex-1 flex flex-col min-w-0 border-l border-border">
					<main className="flex-1 overflow-y-auto p-4 md:p-6">
						<React.Suspense fallback={<DashboardContentLoading />}>
							{children}
						</React.Suspense>
					</main>
					<TerminalStatusBar
						scope={scope}
						session={session}
						league={leagueQuery.data}
						membership={membership}
						membershipError={
							membershipQuery.isError && !isMembershipFallbackError(membershipErrorStatus)
						}
					/>
				</div>
			</div>
		</div>
		</NavCommandProvider>
	);
}
