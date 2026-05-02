import { Link } from "@tanstack/react-router";
import { ChevronRight, Home, Trophy, Shield, PlusCircle, type LucideIcon } from "lucide-react";

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@sports-system/ui/components/collapsible";

import {
	buildMembershipNav,
	buildPrimaryNav,
	getLeagueIdFromPath,
	type ShellScope,
} from "@/shared/components/layouts/shell-navigation";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";

export interface NavGroupItem {
	title: string;
	url: string;
	icon?: LucideIcon;
	isActive?: boolean;
	items?: {
		title: string;
		url: string;
	}[];
}

interface TerminalSidebarProps {
	session: Session | null;
	pathname: string;
	scope: ShellScope;
	league?: LeagueResponse;
	membership?: LeagueMemberResponse;
}

export function TerminalSidebar({
	session,
	pathname,
	scope,
	league,
	membership,
}: TerminalSidebarProps) {
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

	const mainItems: NavGroupItem[] = [
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
			isActive: pathname === "/leagues" || pathname.startsWith("/leagues?"),
		},
		...(session
			? [
					{
						title: "Minhas ligas",
						url: "/my-leagues",
						icon: Shield,
						isActive:
							pathname === "/my-leagues" || pathname.startsWith("/my-leagues?"),
					},
					{
						title: "Criar liga",
						url: "/leagues/new",
						icon: PlusCircle,
						isActive: pathname === "/leagues/new",
					},
				]
			: []),
		...navItems
			.filter(
				(item) =>
					!isLeagueSubRoute(item.href) &&
					item.href !== "/" &&
					item.href !== "/leagues" &&
					!(session && (item.href === "/my-leagues" || item.href === "/leagues/new")),
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

	const secondaryItems: NavGroupItem[] = [
		...navItems
			.filter((item) => isLeagueSubRoute(item.href))
			.map((item) => ({
				title: item.label,
				url: item.href,
				icon: item.icon,
				isActive: item.exact
					? pathname === item.href
					: pathname.startsWith(item.href),
			})),
		...membershipNav.secondary.map((item) => ({
			title: item.label,
			url: item.href,
			icon: item.icon,
			isActive: item.exact
				? pathname === item.href
				: pathname.startsWith(item.href),
			})),
	];

	return (
		<aside className="w-56 shrink-0 bg-card border-r border-border flex flex-col overflow-hidden">
			<div className="flex-1 overflow-y-auto py-2">
				<NavSection label="NAV" items={mainItems} />
				{secondaryItems.length > 0 && (
					<NavSection label="LIGA" items={secondaryItems} />
				)}
			</div>
		</aside>
	);
}

function NavSection({
	label,
	items,
}: {
	label: string;
	items: NavGroupItem[];
}) {
	return (
		<div className="px-2 py-1">
			<div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
				{label}
			</div>
			<div className="mt-0.5">
				{items.map((item) => (
					<NavItem key={item.title} item={item} />
				))}
			</div>
		</div>
	);
}

function NavItem({ item }: { item: NavGroupItem }) {
	const hasSubitems = item.items && item.items.length > 0;

	if (hasSubitems) {
		return (
			<Collapsible defaultOpen={item.isActive}>
				<CollapsibleTrigger className="flex w-full items-center gap-2 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
					<span className="w-3 text-center">{item.isActive ? ">" : " "}</span>
					<span className="flex-1 text-left">{item.title}</span>
					<ChevronRight size={10} className="shrink-0 transition-transform data-[state=open]:rotate-90" />
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="ml-4 border-l border-border pl-2">
						{item.items!.map((sub) => (
							<Link
								key={sub.title}
								to={sub.url}
								className="flex items-center gap-2 px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
							>
								<span className="w-3 text-center text-border">-</span>
								<span>{sub.title}</span>
							</Link>
						))}
					</div>
				</CollapsibleContent>
			</Collapsible>
		);
	}

	return (
		<Link
			to={item.url}
			className={`flex items-center gap-2 px-2 py-1 text-xs transition-colors ${
				item.isActive
					? "bg-muted text-foreground font-medium"
					: "text-muted-foreground hover:text-foreground hover:bg-muted"
			}`}
		>
			<span className="w-3 text-center">{item.isActive ? ">" : " "}</span>
			<span>{item.title}</span>
		</Link>
	);
}
