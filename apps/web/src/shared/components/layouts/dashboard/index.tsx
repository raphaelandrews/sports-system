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
	leagueListQueryOptions,
	myLeagueMembershipQueryOptions,
} from "@/features/leagues/api/queries";
import type { Session } from "@/types/auth";

import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";

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
		<div className="mx-auto flex min-h-screen max-w-480 bg-background lg:border-x lg:border-input">
			<aside className="sticky top-0 z-40 hidden h-screen w-65 shrink-0 flex-col border-r border-input bg-background lg:flex">
				<a href="" className="flex h-18 items-center gap-3 px-6 transition-opacity hover:opacity-80"></a>
			</aside>
			<header className="safe-top fixed inset-x-0 top-0 z-40 flex min-h-14 items-end justify-between px-4 pb-2 transition-all duration-300 ease-out lg:hidden translate-y-0 opacity-100 border-b border-transparent bg-background/90 backdrop-blur-md"></header>
			<div className="fixed inset-0 z-60 bg-black/60 transition-opacity duration-300 ease-out lg:hidden pointer-events-none opacity-0"></div>
			<main className="flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out pt-[calc(3rem+env(safe-area-inset-top,0px))] lg:pt-0"></main>
			<SidebarProvider className="relative h-svh">
				<AppSidebar
					session={session}
					pathname={pathname}
					scope={scope}
					league={leagueQuery.data}
					membership={membership}
				/>
				<SidebarInset className="md:peer-data-[variant=inset]:ml-0">
					<AppHeader
						session={session}
						pathname={pathname}
						scope={scope}
						league={leagueQuery.data}
						membership={membership}
						leagues={leagues}
					/>
					<div className="flex flex-1 flex-col w-11/12 mx-auto max-w-5xl gap-4 overflow-y-auto px-1 py-4 md:py-10 lg:py-12">
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
			</SidebarProvider>
		</div>
	);
}
