import * as React from "react";
import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail,
	useSidebar,
} from "@sports-system/ui/components/sidebar";

import {
	buildMembershipNav,
	buildPrimaryNav,
	getLeagueIdFromPath,
	type ShellScope,
} from "@/shared/components/layouts/shell-navigation";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";

import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-league";
import { Home, Trophy, SquareDotIcon } from "lucide-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	session: Session | null;
	pathname: string;
	scope: ShellScope;
	league?: LeagueResponse;
	membership?: LeagueMemberResponse;
}

export function AppSidebar({
	session,
	pathname,
	scope,
	league,
	membership,
	...props
}: AppSidebarProps) {
	const { state } = useSidebar();
	const leagueId = league ? String(league.id) : getLeagueIdFromPath(pathname);
	const platformRole = (session?.role as Session["role"] | undefined) ?? "USER";

	const membershipNav = buildMembershipNav({
		membershipRole: membership?.role,
		platformRole,
		leagueId,
	});

	const navItems = buildPrimaryNav({
		scope,
		leagueId,
		membershipRole: membership?.role,
		platformRole,
	});

	const leagueBase = leagueId ? `/leagues/${leagueId}` : "";
	const isLeagueSubRoute = (href: string) =>
		leagueId && href.startsWith(leagueBase);

	const mainItems = [
		{
			title: "Início",
			url: "/",
			icon: Home,
			isActive: pathname === "/",
		},
		{
			title: "Ligas",
			url: "/leagues",
			icon: Trophy,
			isActive: pathname.startsWith("/leagues") && !getLeagueIdFromPath(pathname),
		},
		...navItems
			.filter(
				(item) =>
					!isLeagueSubRoute(item.href) &&
					item.href !== "/" &&
					item.href !== "/leagues",
			)
			.map((item) => ({
				title: item.label,
				url: item.href,
				icon: item.icon,
				isActive: item.exact
					? pathname === item.href
					: pathname.startsWith(item.href),
			})),
	];

	const secondaryItems = [
		...navItems
			.filter((item) => isLeagueSubRoute(item.href))
			.map((item) => ({
				name: item.label,
				url: item.href,
				icon: item.icon,
				isActive: item.exact
					? pathname === item.href
					: pathname.startsWith(item.href),
			})),
		...membershipNav.secondary.map((item) => ({
			name: item.label,
			url: item.href,
			icon: item.icon,
			isActive: item.exact
				? pathname === item.href
				: pathname.startsWith(item.href),
		})),
		...membershipNav.support.map((item) => ({
			name: item.label,
			url: item.href,
			icon: item.icon,
			isActive: item.exact
				? pathname === item.href
				: pathname.startsWith(item.href),
		})),
	];

	return (
		<Sidebar collapsible="icon" variant="inset" {...props}>
			<SidebarHeader>
				<div className={`flex items-center w-full h-full px-2 ${state === "expanded" ? "justify-start" : ""}`}>
					<SquareDotIcon size={20} />
				</div>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={mainItems} />
				{secondaryItems.length > 0 && <NavSecondary items={secondaryItems} />}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
