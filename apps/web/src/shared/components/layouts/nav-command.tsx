import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Command as CommandIcon } from "lucide-react";

import { Button } from "@sports-system/ui/components/button";
import {
	buildMembershipNav,
	buildPrimaryNav,
	getLeagueIdFromPath,
	type ShellScope,
} from "@/shared/components/layouts/shell-navigation";
import { NavCommandContext } from "@/shared/components/layouts/nav-command-context";
import { CommandDialog } from "@/shared/components/ui/command-dialog";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";

interface NavCommandProps {
	session: Session | null;
	scope: ShellScope;
	league?: LeagueResponse;
	membership?: LeagueMemberResponse;
	children?: React.ReactNode;
}

interface NavItem {
	id: string;
	label: string;
	href: string;
	group: string;
}

export function NavCommandProvider({
	session,
	scope,
	league,
	membership,
	children,
}: NavCommandProps) {
	const [open, setOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const pathname = useRouterState({ select: (state) => state.location.pathname });

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

	const items = useMemo<NavItem[]>(() => {
		const result: NavItem[] = [];

		result.push({
			id: "home",
			label: "Início",
			href: "/",
			group: "Plataforma",
		});

		result.push({
			id: "leagues",
			label: "Ligas",
			href: "/leagues",
			group: "Plataforma",
		});

		if (session) {
			result.push({
				id: "my-leagues",
				label: "Minhas ligas",
				href: "/my-leagues",
				group: "Plataforma",
			});

			result.push({
				id: "create-league",
				label: "Criar liga",
				href: "/leagues/new",
				group: "Plataforma",
			});

			result.push({
				id: "profile",
				label: "Perfil",
				href: "/profile",
				group: "Plataforma",
			});
		}

		const platformHrefs = new Set(["/", "/leagues", "/my-leagues", "/leagues/new", "/profile"]);
		navItems
			.filter((item) => !isLeagueSubRoute(item.href) && !platformHrefs.has(item.href))
			.forEach((item) => {
				result.push({
					id: `nav-${item.href}`,
					label: item.label,
					href: item.href,
					group: leagueId ? "Liga (público)" : "Navegação",
				});
			});

		navItems
			.filter((item) => isLeagueSubRoute(item.href))
			.forEach((item) => {
				result.push({
					id: `league-${item.href}`,
					label: item.label,
					href: item.href,
					group: "Liga",
				});
			});

		membershipNav.secondary.forEach((item) => {
			result.push({
				id: `dash-${item.href}`,
				label: item.label,
				href: item.href,
				group: "Área autenticada",
			});
		});

		if (!session) {
			result.push({
				id: "login",
				label: "Entrar",
				href: "/login",
				group: "Autenticação",
			});

			result.push({
				id: "register",
				label: "Criar conta",
				href: "/register",
				group: "Autenticação",
			});
		}

		return result;
	}, [session, leagueId, navItems, membershipNav]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "n" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
				e.preventDefault();
				setOpen((prev) => !prev);
				return;
			}

			if (!open) return;

			switch (e.key) {
				case "ArrowDown":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev >= items.length - 1 ? 0 : prev + 1
					);
					break;
				case "ArrowUp":
					e.preventDefault();
					setSelectedIndex((prev) =>
						prev <= 0 ? items.length - 1 : prev - 1
					);
					break;
				case "Enter":
					e.preventDefault();
					if (items[selectedIndex]) {
						setOpen(false);
						const el = document.querySelector(
							`[data-nav-index="${selectedIndex}"]`
						) as HTMLElement;
						el?.click();
					}
					break;
				case "Escape":
					e.preventDefault();
					setOpen(false);
					break;
			}
		},
		[open, items, selectedIndex]
	);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	useEffect(() => {
		if (open) {
			setSelectedIndex(0);
		}
	}, [open]);

	const grouped = items.reduce<Record<string, NavItem[]>>((acc, item) => {
		if (!acc[item.group]) acc[item.group] = [];
		acc[item.group].push(item);
		return acc;
	}, {});

	return (
		<NavCommandContext.Provider value={{ open: () => setOpen(true), close: () => setOpen(false) }}>
			{children}
			{open && (
				<NavCommandOverlay
					grouped={grouped}
					selectedIndex={selectedIndex}
					onClose={() => setOpen(false)}
				/>
			)}
		</NavCommandContext.Provider>
	);
}

function NavCommandOverlay({
	grouped,
	selectedIndex,
	onClose,
}: {
	grouped: Record<string, NavItem[]>;
	selectedIndex: number;
	onClose: () => void;
}) {
	let globalIndex = 0;

	return (
		<CommandDialog open onClose={onClose}>
			<div className="max-h-[50vh] overflow-y-auto py-1">
				{Object.entries(grouped).map(([group, groupItems]) => (
					<div key={group}>
						<div className="p-1 text-sm font-bold">
							{group}
						</div>
						{groupItems.map((item) => {
							const index = globalIndex++;
							const isSelected = index === selectedIndex;

							return (
								<Link
									key={item.id}
									to={item.href}
									data-nav-index={index}
									className={`flex items-center justify-between px-3 py-1.5 text-sm transition ${isSelected
											? "bg-success text-cream"
											: "text-muted"
										}`}
									onClick={onClose}
								>
									<span>{item.label}</span>
								</Link>
							);
						})}
					</div>
				))}
			</div>
		</CommandDialog>
	);
}

export function NavCommandButton() {
	const { open } = useContext(NavCommandContext);

	return (
		<Button
			variant="ghost"
			size="sm"
			className="h-7 px-2 text-xs gap-1.5 text-muted-foreground"
			onClick={open}
		>
			<CommandIcon size={12} />
			<span className="hidden sm:inline">Navegar</span>
			<kbd className="pointer-events-none ml-1 inline-flex h-4 select-none items-center gap-0.5 border border-border bg-muted px-1 font-mono text-[9px]">
				<span>⌘</span>N
			</kbd>
		</Button>
	);
}
