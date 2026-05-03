import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import * as m from "@/paraglide/messages";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { LeagueCard } from "@/shared/components/ui/league-card";
import { Title } from "@/shared/components/ui/title";
import { SideInfo } from "@/shared/components/ui/side-info";
import { SideCard } from "@/shared/components/ui/side-card";
import { buttonVariants } from "@sports-system/ui/components/button";

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
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex flex-1">
        <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 pt-3 pb-24 lg:gap-4 lg:border-r lg:border-input lg:px-10 lg:pt-6 lg:pb-12">
          <Title title={m['home.title']()} description={m['home.subtitle']()} />


        </div>
        <SideInfo>
          {popularLeagues.length > 0 && (
            <SideCard title={m['home.popularLeagues']()}>
              <div className="flex flex-col gap-2">
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

              <div className="flex flex-col mt-4">
                <Link
                  to="/leagues"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Ver todas
                </Link>
              </div>
            </SideCard>
          )}

          {latestLeagues.length > 0 && (
            <SideCard title={m['home.recentLeagues']()}>
              <div className="flex flex-col gap-2">
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

              <div className="flex flex-col mt-4">
                <Link
                  to="/leagues"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Ver todas
                </Link>
              </div>
            </SideCard>
          )}
        </SideInfo>
      </div>
    </div>
  );
}
