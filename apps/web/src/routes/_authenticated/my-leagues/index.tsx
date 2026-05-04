import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

import * as m from "@/paraglide/messages";
import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sports-system/ui/components/empty";
import { cn } from "@sports-system/ui/lib/utils";
import {
  myLeagueMembershipQueryOptions,
  myLeaguesQueryOptions,
  leagueListQueryOptions,
} from "@/features/leagues/api/queries";
import { LeagueCard } from "@/shared/components/ui/league-card";
import { Title } from "@/shared/components/ui/title";
import { PageLayout } from "@/shared/components/layouts/page-layout";
import { LeaguesSidebar } from "@/shared/components/ui/leagues-sidebar";

export const Route = createFileRoute("/_authenticated/my-leagues/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(myLeaguesQueryOptions()),
      queryClient.ensureQueryData(leagueListQueryOptions()),
    ]),
  component: MyLeaguesPage,
});

const roleLabel: Record<string, string> = {
  LEAGUE_ADMIN: m['myLeagues.role.admin'](),
  CHIEF: m['myLeagues.role.chief'](),
  COACH: m['myLeagues.role.coach'](),
  ATHLETE: m['myLeagues.role.athlete'](),
};

function MyLeaguesPage() {
  const { data: myLeagues } = useSuspenseQuery(myLeaguesQueryOptions());
  const { data: allLeagues } = useSuspenseQuery(leagueListQueryOptions());

  const membershipQueries = useQueries({
    queries: myLeagues.map((league) => myLeagueMembershipQueryOptions(league.id)),
  });

  return (
    <PageLayout sidebar={<LeaguesSidebar leagues={allLeagues} />}>
      <div className="flex items-center justify-between mb-8">
        <Title title={m['myLeagues.title']()}/>

        <Link to="/leagues/new" className={cn(buttonVariants({variant: "default"}))}>
          {m['nav.createLeague']()}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        {myLeagues.map((league, index) => {
          const membership = membershipQueries[index]?.data;
          return (
            <LeagueCard
              key={league.id}
              id={league.id}
              name={league.name}
              logoUrl={league.logo_url}
              memberCount={league.member_count}
              href="/leagues/$leagueId"
              badge={
                membership ? (
                  <Badge
                    variant="outline"
                    className="bg-black/40 text-white border-white/30 backdrop-blur-sm"
                  >
                    {roleLabel[membership.role] ?? membership.role}
                  </Badge>
                ) : undefined
              }
            />
          );
        })}
      </div>

      {myLeagues.length === 0 && (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>{m['myLeagues.empty']()}</EmptyTitle>
            <EmptyDescription>Crie a primeira liga para começar.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/leagues/new" className={cn(buttonVariants({size: "sm"}), "text-sm")}>
              {m['nav.createLeague']()}
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </PageLayout>
  );
}
