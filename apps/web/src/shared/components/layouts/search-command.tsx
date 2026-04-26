import { useQueries } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronRight,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sports-system/ui/components/dialog";
import { Input } from "@sports-system/ui/components/input";
import { formatDate, formatTime } from "@/shared/lib/date";
import { userSearchQueryOptions } from "@/features/users/api/queries";
import { globalSearchQueryOptions } from "@/features/search/api/queries";
import type { Session } from "@/types/auth";
import type { LeagueMemberRole, LeagueResponse } from "@/types/leagues";

type QuickAction = {
  label: string;
  description: string;
  href: string;
  icon: typeof Search;
};

export function SearchCommand({
  leagueId,
  session,
  membershipRole,
  leagues,
}: {
  leagueId?: string;
  session: Session;
  membershipRole?: LeagueMemberRole;
  leagues: LeagueResponse[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();
  const canSearchUsers =
    session.role === "ADMIN" ||
    session.role === "SUPERADMIN" ||
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

  const quickActions = useMemo<QuickAction[]>(
    () =>
      leagueId
        ? [
            {
              label: "Calendário",
              description: "Abrir agenda oficial da liga",
              href: `/leagues/${leagueId}/dashboard/calendar`,
              icon: CalendarDays,
            },
            {
              label: "Delegações",
              description: "Ir para gestão e consulta de delegações",
              href: `/leagues/${leagueId}/dashboard/delegations`,
              icon: Users,
            },
            {
              label: "Narrativa",
              description: "Abrir acompanhamento narrativo da competição",
              href: `/leagues/${leagueId}/narrative`,
              icon: Sparkles,
            },
          ]
        : [
            {
              label: "Explorar ligas",
              description: "Abrir a lista pública de ligas",
              href: "/leagues",
              icon: Globe,
            },
          ],
    [leagueId],
  );

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
  const totalResults =
    (leagueResults?.athletes.length ?? 0) +
    (leagueResults?.delegations.length ?? 0) +
    (leagueResults?.events.length ?? 0) +
    userResults.length +
    matchingLeagues.length;
  const isSearching = leagueSearchQuery.isFetching || userSearchQuery.isFetching;

  const title = leagueId ? "Buscar na liga" : "Buscar na plataforma";
  const description = leagueId
    ? "Pesquise pessoas, ligas e entidades da competição sem sair do shell."
    : "Pesquise pessoas e ligas sem sair do shell.";

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Search className="size-4" />
        Buscar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl gap-0 p-0" showCloseButton={false}>
          <DialogHeader className="border-b px-4 pt-4 pb-3">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="border-b px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 border-0 bg-transparent pl-9 text-sm shadow-none focus-visible:ring-0"
                placeholder="Buscar por nome, código, modalidade, esporte ou local"
              />
            </div>
          </div>

          <div className="max-h-[65dvh] overflow-y-auto p-2">
            {trimmedQuery.length < 2 ? (
              <div className="space-y-1">
                <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                  Ações rápidas
                </div>
                {quickActions.map((action) => (
                  <Link
                    key={action.href}
                    to={action.href}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                      <action.icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : isSearching ? (
              <div className="px-3 py-8 text-sm text-muted-foreground">Buscando...</div>
            ) : totalResults === 0 ? (
              <div className="px-3 py-8 text-sm text-muted-foreground">
                Nenhum resultado encontrado para &quot;{trimmedQuery}&quot;.
              </div>
            ) : (
              <div className="space-y-3">
                {userResults.length ? (
                  <div>
                    <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                      Usuários
                    </div>
                    {userResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm"
                      >
                        <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                          <UserCircle2 className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.email} · {user.role} · {user.is_active ? "Ativo" : "Inativo"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {matchingLeagues.length ? (
                  <div>
                    <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">Ligas</div>
                    {matchingLeagues.map((league) => (
                      <Link
                        key={league.id}
                        to="/leagues/$leagueId"
                        params={{ leagueId: String(league.id) }}
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                          <Globe className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{league.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {league.slug} · {league.timezone} · {league.member_count} membros
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                ) : null}

                {leagueResults?.athletes.length ? (
                  <div>
                    <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                      Atletas
                    </div>
                    {leagueResults.athletes.map((athlete) => (
                      <Link
                        key={athlete.id}
                        to="/leagues/$leagueId/athletes/$athleteId"
                        params={{ leagueId: leagueId ?? "", athleteId: String(athlete.id) }}
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                          <Medal className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{athlete.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {athlete.code} · {athlete.is_active ? "Ativo" : "Inativo"}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {leagueResults?.delegations.length ? (
                  <div>
                    <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                      Delegações
                    </div>
                    {leagueResults.delegations.map((delegation) => (
                      <Link
                        key={delegation.id}
                        to="/leagues/$leagueId/delegations/$delegationId"
                        params={{ leagueId: leagueId ?? "", delegationId: String(delegation.id) }}
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                          <Users className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{delegation.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {delegation.code} · {delegation.is_active ? "Ativa" : "Inativa"}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {leagueResults?.events.length ? (
                  <div>
                    <div className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                      Eventos
                    </div>
                    {leagueResults.events.map((event) => (
                      <Link
                        key={event.id}
                        to="/leagues/$leagueId/competitions/$competitionId"
                        params={{
                          leagueId: leagueId ?? "",
                          competitionId: String(event.competition_id),
                        }}
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      >
                        <div className="flex size-8 items-center justify-center rounded-md border bg-background">
                          <CalendarDays className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">
                            {event.sport_name} · {event.modality_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            #{event.number} · {formatDate(event.event_date)} ·{" "}
                            {formatTime(event.start_time)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {event.venue ?? "Local não definido"} · {event.status}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
