"use client";

import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	CalendarDays,
	Globe,
	Search,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@sports-system/ui/components/button";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@sports-system/ui/components/avatar";
import {
	Command,
	CommandDialog,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "@sports-system/ui/components/command";
import { userSearchQueryOptions } from "@/features/users/api/queries";
import { globalSearchQueryOptions } from "@/features/search/api/queries";
import type { Session } from "@/types/auth";
import type { LeagueMemberRole, LeagueResponse } from "@/types/leagues";

interface GlobalSearchResult {
	query: string;
	athletes: Array<{
		id: number;
		name: string;
		code: string;
		is_active: boolean;
		league_id: number;
	}>;
	delegations: Array<{
		id: number;
		name: string;
		code: string;
		is_active: boolean;
		league_id: number;
	}>;
	events: Array<{
		id: number;
		competition_id: number;
		league_id: number;
		number: number;
		sport_name: string;
		modality_name: string;
		venue: string | null;
		event_date: string;
		start_time: string;
		phase: string;
		status: string;
	}>;
}

export function SearchCommand({
	leagueId,
	session,
	membershipRole,
	leagues,
}: {
	leagueId?: string;
	session: Session | null;
	membershipRole?: LeagueMemberRole;
	leagues: LeagueResponse[];
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const trimmedQuery = query.trim();

	const [leagueSearchQuery, userSearchQuery] = useQueries({
		queries: [
			{
				...globalSearchQueryOptions(trimmedQuery, leagueId ? Number(leagueId) : undefined),
				enabled: trimmedQuery.length >= 2,
			},
			{
				...userSearchQueryOptions(trimmedQuery),
				enabled: Boolean(session) && trimmedQuery.length >= 2,
			},
		],
	});

	useEffect(() => {
		if (!open) {
			setQuery("");
		}
	}, [open]);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	const quickActions = useMemo(() => {
		if (!leagueId) {
			return [
				{
					label: "Explorar ligas",
					href: "/leagues",
					icon: Globe,
				},
			];
		}

		const actions = [
			{
				label: "Visão geral",
				href: `/leagues/${leagueId}`,
				icon: Globe,
			},
			{
				label: "Calendário",
				href: `/leagues/${leagueId}/calendar`,
				icon: CalendarDays,
			},
		];

		return actions;
	}, [leagueId, membershipRole, session]);

	const leagueResults = leagueSearchQuery.data as GlobalSearchResult | undefined;
	const userResults = userSearchQuery.data ?? [];
	const matchingLeagues = useMemo(() => {
		if (trimmedQuery.length < 2) {
			return [];
		}

		const normalized = trimmedQuery.toLowerCase();

		return leagues
			.filter((league) =>
				[league.name, league.slug, league.description ?? ""].some((value) =>
					value.toLowerCase().includes(normalized),
				),
			)
			.slice(0, 8);
	}, [leagues, trimmedQuery]);

	const isSearching = leagueSearchQuery.isFetching || userSearchQuery.isFetching;

	const hasAnyResults =
		matchingLeagues.length > 0 ||
		userResults.length > 0 ||
		(leagueResults?.athletes?.length ?? 0) > 0 ||
		(leagueResults?.delegations?.length ?? 0) > 0 ||
		(leagueResults?.events?.length ?? 0) > 0;

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				className="text-muted-foreground text-sm"
				onClick={() => setOpen(true)}
			>
				<Search data-icon="inline-start" />
				Buscar
				<kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
					<span className="text-xs">⌘</span>K
				</kbd>
			</Button>

			<CommandDialog
				open={open}
				onOpenChange={setOpen}
				title="Buscar"
				description="Pesquise pessoas, ligas e entidades da competição"
				showCloseButton={false}
			>
				<Command
					shouldFilter={false}
					className="**:data-[selected=true]:bg-muted **:data-selected:bg-transparent"
				>
					<CommandInput
						placeholder="Buscar por nome, código, modalidade, esporte ou local..."
						value={query}
						onValueChange={setQuery}
					/>
					<CommandList>
						{isSearching ? (
							<div className="py-6 text-center text-sm text-muted-foreground">
								Buscando...
							</div>
						) : trimmedQuery.length < 2 ? (
							quickActions.length > 0 && (
								<CommandGroup heading="Ações rápidas">
									{quickActions.map((action) => (
										<CommandItem
											key={action.href}
											value={`action-${action.href}`}
											onSelect={() => setOpen(false)}
										>
											<action.icon />
											<Link
												to={action.href}
												className="flex flex-1 items-center"
											>
												<span>{action.label}</span>
											</Link>
										</CommandItem>
									))}
								</CommandGroup>
							)
						) : hasAnyResults ? (
							<>
								{matchingLeagues.length > 0 && (
									<CommandGroup heading="Ligas">
										{matchingLeagues.map((league) => (
											<CommandItem
												key={league.id}
												value={`league-${league.id}`}
												onSelect={() => setOpen(false)}
												className="hover:bg-accent!"
											>
												<Avatar className="h-6 w-6 rounded-md after:border-none bg-card">
													<AvatarImage src={league.logo_url ?? ""} alt={league.name} />
													<AvatarFallback className="text-xs bg-card">
														{league.name.charAt(0)}
													</AvatarFallback>
												</Avatar>
												<Link
													to="/leagues/$leagueId"
													params={{ leagueId: String(league.id) }}
													className="flex flex-1 items-center"
												>
													<span>{league.name}</span>
												</Link>
											</CommandItem>
										))}
									</CommandGroup>
								)}

								{userResults.length > 0 && (
									<CommandGroup heading="Usuários">
										{userResults.map((user) => (
											<CommandItem
												key={user.id}
												value={`user-${user.id}`}
												onSelect={() => setOpen(false)}
												className="hover:bg-accent!"
											>
												<Avatar className="h-6 w-6 rounded-md after:border-none bg-muted">
													<AvatarImage src={user.avatar_url ?? ""} alt={user.name} />
													<AvatarFallback className="text-xs">
														{user.name.charAt(0)}
													</AvatarFallback>
												</Avatar>
												<span className="flex-1">{user.name}</span>
											</CommandItem>
										))}
									</CommandGroup>
								)}

								{leagueResults?.delegations?.length ? (
									<CommandGroup heading="Delegações">
										{leagueResults.delegations.map((delegation) => (
											<CommandItem
												key={delegation.id}
												value={`delegation-${delegation.id}`}
												onSelect={() => setOpen(false)}
												className="hover:bg-accent!"
											>
												<Users className="size-4 text-muted-foreground" />
												<Link
													to="/leagues/$leagueId/delegations/$delegationId"
													params={{
														leagueId: String(delegation.league_id),
														delegationId: String(delegation.id),
													}}
													className="flex flex-1 items-center"
												>
													<span>{delegation.name}</span>
												</Link>
												<CommandShortcut>{delegation.code}</CommandShortcut>
											</CommandItem>
										))}
									</CommandGroup>
								) : null}

								{leagueResults?.events?.length ? (
									<CommandGroup heading="Eventos">
										{leagueResults.events.map((event) => (
											<CommandItem
												key={event.id}
												value={`event-${event.id}`}
												onSelect={() => setOpen(false)}
												className="hover:bg-accent!"
											>
												<CalendarDays className="size-4 text-muted-foreground" />
												<Link
													to="/leagues/$leagueId/competitions/$competitionId"
													params={{
														leagueId: String(event.league_id),
														competitionId: String(event.competition_id),
													}}
													className="flex flex-1 items-center"
												>
													<span>
														{event.sport_name} · {event.modality_name}
													</span>
												</Link>
												<CommandShortcut>#{event.number}</CommandShortcut>
											</CommandItem>
										))}
									</CommandGroup>
								) : null}
							</>
						) : (
							<div className="py-6 text-center text-sm text-muted-foreground">
								Nenhum resultado encontrado para &quot;{trimmedQuery}&quot;.
							</div>
						)}
					</CommandList>
				</Command>
			</CommandDialog>
		</>
	);
}
