import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import { cn } from "@sports-system/ui/lib/utils";
import {
  myLeagueMembershipQueryOptions,
  myLeaguesQueryOptions,
} from "@/features/leagues/api/queries";
import { LeagueCard } from "@/shared/components/ui/league-card";

export const Route = createFileRoute("/_authenticated/my-leagues/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(myLeaguesQueryOptions()),
  component: MyLeaguesPage,
});

const roleLabel: Record<string, string> = {
  LEAGUE_ADMIN: "Admin",
  CHIEF: "Chefe",
  COACH: "Técnico",
  ATHLETE: "Atleta",
};

function MyLeaguesPage() {
  const { data: leagues } = useSuspenseQuery(myLeaguesQueryOptions());

  const membershipQueries = useQueries({
    queries: leagues.map((league) => myLeagueMembershipQueryOptions(league.id)),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Minhas ligas</h1>
        <Link to="/leagues/new" className={cn(buttonVariants({ size: "sm" }), "text-sm")}>
          Criar liga
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league, index) => {
          const membership = membershipQueries[index]?.data;
          return (
            <div key={league.id} className="relative">
              {membership && (
                <Badge
                  variant="outline"
                  className="absolute top-3 right-3 z-10 bg-black/40 text-white border-white/30 backdrop-blur-sm"
                >
                  {roleLabel[membership.role] ?? membership.role}
                </Badge>
              )}
              <LeagueCard
                id={league.id}
                name={league.name}
                logoUrl={league.logo_url}
                memberCount={league.member_count}
                href="/leagues/$leagueId"
              />
            </div>
          );
        })}
      </div>

      {leagues.length === 0 && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Você ainda não participa de nenhuma liga.</p>
          <Link to="/leagues" className={cn(buttonVariants())}>
            Explorar ligas
          </Link>
        </div>
      )}
    </>
  );
}
