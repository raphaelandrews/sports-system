import { Link } from "@tanstack/react-router";
import { Terminal, Bell, Moon, Sun, User, LogOut, Sparkles } from "lucide-react";

import { Button } from "@sports-system/ui/components/button";
import { SearchCommand } from "@/shared/components/layouts/search-command";
import { NavCommandButton } from "@/shared/components/layouts/nav-command";
import { logoutFn } from "@/features/auth/server/auth";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";
import type { ShellScope } from "@/shared/components/layouts/shell-navigation";

interface TerminalHeaderProps {
	session: Session | null;
	pathname: string;
	scope: ShellScope;
	league?: LeagueResponse;
	membership?: LeagueMemberResponse;
	leagues: LeagueResponse[];
}

export function TerminalHeader({
	session,
	scope,
	league,
	membership,
	leagues,
}: TerminalHeaderProps) {
	const router = useRouter();
	const { theme, setTheme } = useTheme();
	const leagueId = league ? String(league.id) : undefined;

	const contextPath = league
		? `~/leagues/${league.id}`
		: scope === "site-authenticated"
			? "~/platform"
			: "~";

	const userLabel = session ? session.name : "guest";
	const roleLabel = membership?.role ?? session?.role ?? "public";

	async function handleLogout() {
		await logoutFn();
		await router.invalidate();
		await router.navigate({ to: "/login" });
		toast.success("Sessão encerrada");
	}

	return (
		<>
			<header className="flex h-10 shrink-0 items-center border-b bg-card px-3 text-xs">
				<div className="flex items-center gap-3 flex-1 min-w-0">
					<Terminal size={14} className="shrink-0 text-muted-foreground" />
					<span className="text-muted-foreground shrink-0">sports-system</span>
					<span className="text-border">/</span>
					<span className="truncate text-foreground">{contextPath}</span>
					<span className="text-muted-foreground ml-2 hidden md:inline">
						[{roleLabel.toLowerCase()}]
					</span>
				</div>

				<div className="flex items-center gap-1 shrink-0">
					<SearchCommand
						leagueId={leagueId}
						session={session}
						membershipRole={membership?.role}
						leagues={leagues}
					/>
					<NavCommandButton />

					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
					>
						{theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
					</Button>

					{session && (
						<>
							<Button variant="ghost" size="icon" className="h-7 w-7 relative">
								<Bell size={13} />
								<span className="absolute top-1 right-1 h-1.5 w-1.5 bg-primary rounded-full" />
							</Button>
							<span className="text-border mx-1">|</span>
						</>
					)}

					{session ? (
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-xs gap-1.5"
								render={<Link to="/profile" />}
							>
								<User size={12} />
								<span className="hidden sm:inline">{userLabel}</span>
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7"
								onClick={() => void handleLogout()}
							>
								<LogOut size={13} />
							</Button>
						</div>
					) : (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs gap-1.5"
							render={<Link to="/login" />}
						>
							<Sparkles size={12} />
							Entrar
						</Button>
					)}
				</div>
			</header>
		</>
	);
}
