import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@sports-system/ui/components/breadcrumb";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@sports-system/ui/components/avatar";
import { Separator } from "@sports-system/ui/components/separator";
import { SidebarTrigger } from "@sports-system/ui/components/sidebar";
import { Button } from "@sports-system/ui/components/button";
import { Link } from "@tanstack/react-router";

import { SearchCommand } from "@/shared/components/layouts/search-command";
import { AnimatedThemeToggler } from "@/shared/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/shared/components/ui/notification-bell";
import { NavUser } from "./nav-user";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";
import type { ShellScope } from "@/shared/components/layouts/shell-navigation";

interface AppHeaderProps {
	session: Session | null;
	pathname: string;
	scope: ShellScope;
	league?: LeagueResponse;
	membership?: LeagueMemberResponse;
	leagues: LeagueResponse[];
}

export function AppHeader({ session, scope, league, membership, leagues }: AppHeaderProps) {
	const leagueId = league ? String(league.id) : undefined;

	const breadcrumbTitle = league
		? league.name
		: scope === "site-authenticated"
			? "SportsHub"
			: "Início";


	return (
		<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear">
			<div className="flex items-center gap-2 flex-1">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 self-center! data-[orientation=vertical]:h-4" />
				{league?.logo_url && (
					<Avatar className="h-6 w-6 rounded-md">
						<AvatarImage src={league.logo_url} alt={league.name} />
						<AvatarFallback className="rounded-md text-xs">
							{league.name.charAt(0)}
						</AvatarFallback>
					</Avatar>
				)}
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbPage>{breadcrumbTitle}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</div>
			<div className="flex items-center gap-3">
				<SearchCommand
					leagueId={leagueId}
					session={session}
					membershipRole={membership?.role}
					leagues={leagues}
				/>
				<AnimatedThemeToggler
					variant="ghost"
					size="icon"
					className="size-8 hover:bg-muted"
				/>
				{session ? <NotificationBell userId={session.id} /> : null}
				<Separator
					className="h-4 data-[orientation=vertical]:self-center"
					orientation="vertical"
				/>
				{session ? <NavUser session={session} /> : (
					<Button size="sm" variant="default" className="text-sm" render={<Link to="/login" />}>
						Entrar
					</Button>
				)}
			</div>
		</header>
	);
}
