import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { LeagueCard } from "@/shared/components/ui/league-card";
import { Title } from "@/shared/components/ui/title";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(leagueListQueryOptions()),
  component: HomePage,
});

function HomePage() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());

  const latestLeagues = [...leagues]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 9);

  const popularLeagues = [...leagues]
    .sort((left, right) => right.member_count - left.member_count)
    .slice(0, 12);

  return (
    <main className="flex flex-col gap-8">
      <Title title="SportsHub" subtitle="Crie, participe e acompanhe ligas esportivas." />

      {popularLeagues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ligas populares</h2>
            <Link
              to="/leagues"
              className="font-medium text-sm text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {popularLeagues.map((league) => (
              <LeagueCard
                key={league.id}
                id={league.id}
                name={league.name}
                logoUrl={league.logo_url}
                memberCount={league.member_count}
                href="/leagues/$leagueId"
              />
            ))}
          </div>
        </section>
      )}

      {latestLeagues.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ligas recentes</h2>
            <Link
              to="/leagues"
              className="font-medium text-sm text-muted-foreground hover:text-foreground"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {latestLeagues.map((league) => (
              <LeagueCard
                key={league.id}
                id={league.id}
                name={league.name}
                logoUrl={league.logo_url}
                memberCount={league.member_count}
                href="/leagues/$leagueId"
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
