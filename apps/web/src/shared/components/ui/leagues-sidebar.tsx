import { Link } from "@tanstack/react-router";
import * as m from "@/paraglide/messages";
import { LeagueSideCard } from "@/shared/components/ui/league-side-card";
import { SideCard } from "@/shared/components/ui/side-card";
import { buttonVariants } from "@sports-system/ui/components/button";
import type { components } from "@/types/api.gen";

export function LeaguesSidebar({ leagues }: { leagues: components["schemas"]["LeagueResponse"][] }) {
  const latestLeagues = [...leagues]
    .sort((left, right) => right.created_at.localeCompare(left.created_at))
    .slice(0, 9);

  const popularLeagues = [...leagues]
    .sort((left, right) => right.member_count - left.member_count)
    .slice(0, 12);

  return (
    <>
      {popularLeagues.length > 0 && (
        <SideCard title={<>🔥 {m['home.popularLeagues']()}</>}>
          <div className="flex flex-col gap-2">
            {popularLeagues.map((league) => (
              <LeagueSideCard
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
        <SideCard title={<>🎉 {m['home.recentLeagues']()}</>}>
          <div className="flex flex-col gap-2">
            {latestLeagues.map((league) => (
              <LeagueSideCard
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
    </>
  );
}
