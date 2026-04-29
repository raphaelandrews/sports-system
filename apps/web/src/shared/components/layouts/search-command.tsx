"use client";

import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	CalendarDays,
	Globe,
	Medal,
	Search,
	Sparkles,
	UserCircle2,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@sports-system/ui/components/button";
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
	const canSearchUsers =
		session?.role === "ADMIN" ||
		session?.role === "SUPERADMIN" ||
		membershipRole === "LEAGUE_ADMIN" ||
		membershipRole === "CHIEF";

	const [leagueSearchQuery, userSearchQuery] = useQueries({
		queries: [
			{
				...globalSearchQueryOptions(trimmedQuery, leagueId ? Number(leagueId) : undefined),
				enabled: Boolean(leagueId) && trimmedQuery.length >= 2,
			},
			{
				...userSearchQueryOptions(trimmedQuery),
				enabled: canSearchUsers && trimmedQuery.length >= 2,
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
					description: "Abrir a lista pública de ligas",
					href: "/leagues",
					icon: Globe,
				},
			];
		}

		const actions = [
			{
				label: "Visão geral",
				description: "Voltar para a página principal da liga",
				href: `/leagues/${leagueId}`,
				icon: Globe,
			},
			{
				label: "Calendário",
				description: "Abrir agenda oficial da liga",
				href: `/leagues/${leagueId}/calendar`,
				icon: CalendarDays,
			},
		];

		if (session && membershipRole) {
			actions.push({
				label: "Painel",
				description: "Entrar na área operacional da liga",
				href: `/leagues/${leagueId}/dashboard`,
				icon: Users,
			});
			actions.push({
				label: "Narrativa",
				description: "Abrir acompanhamento narrativo da competição",
				href: `/leagues/${leagueId}/narrative`,
				icon: Sparkles,
			});
		}

		return actions;
	}, [leagueId, membershipRole, session]);

	const leagueResults = leagueSearchQuery.data;
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
											value={action.label}
											onSelect={() => setOpen(false)}
										>
											<action.icon />
											<Link
												to={action.href}
												className="flex flex-1 items-center"
											>
												<span>{action.label}</span>
											</Link>
											<CommandShortcut>{action.description}</CommandShortcut>
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
												value={league.name}
												onSelect={() => setOpen(false)}
											>
												<Globe />
												<Link
													to="/leagues/$leagueId"
													params={{ leagueId: String(league.id) }}
													className="flex flex-1 items-center"
												>
													<span>{league.name}</span>
												</Link>
												<CommandShortcut>{league.slug}</CommandShortcut>
											</CommandItem>
										))}
									</CommandGroup>
								)}

								{userResults.length > 0 && (
									<CommandGroup heading="Usuários">
										{userResults.map((user) => (
											<CommandItem
												key={user.id}
												value={`${user.name} ${user.email}`}
												onSelect={() => setOpen(false)}
											>
												<UserCircle2 />
												<span className="flex-1">{user.name}</span>
												<CommandShortcut>{user.email}</CommandShortcut>
											</CommandItem>
										))}
									</CommandGroup>
								)}

								{leagueResults?.athletes?.length ? (
									<CommandGroup heading="Atletas">
										{leagueResults.athletes.map((athlete) => (
											<CommandItem
												key={athlete.id}
												value={athlete.name}
												onSelect={() => setOpen(false)}
											>
												<Medal />
												<Link
													to="/leagues/$leagueId/athletes/$athleteId"
													params={{
														leagueId: leagueId ?? "",
														athleteId: String(athlete.id),
													}}
													className="flex flex-1 items-center"
												>
													<span>{athlete.name}</span>
												</Link>
												<CommandShortcut>{athlete.code}</CommandShortcut>
											</CommandItem>
										))}
									</CommandGroup>
								) : null}

								{leagueResults?.delegations?.length ? (
									<CommandGroup heading="Delegações">
										{leagueResults.delegations.map((delegation) => (
											<CommandItem
												key={delegation.id}
												value={delegation.name}
												onSelect={() => setOpen(false)}
											>
												<Users />
												<Link
													to="/leagues/$leagueId/delegations/$delegationId"
													params={{
														leagueId: leagueId ?? "",
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
												value={`${event.sport_name} ${event.modality_name}`}
												onSelect={() => setOpen(false)}
											>
												<CalendarDays />
												<Link
													to="/leagues/$leagueId/competitions/$competitionId"
													params={{
														leagueId: leagueId ?? "",
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
