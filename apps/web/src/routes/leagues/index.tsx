import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
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
import * as m from "@/paraglide/messages";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { LeagueCard } from "@/shared/components/ui/league-card";
import { Title } from "@/shared/components/ui/title";
import { PageLayout } from "@/shared/components/layouts/page-layout";
import { LeaguesSidebar } from "@/shared/components/ui/leagues-sidebar";

export const Route = createFileRoute("/leagues/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(leagueListQueryOptions()),
  component: LeaguesPage,
});

function LeaguesPage() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());

  return (
    <PageLayout sidebar={<LeaguesSidebar leagues={leagues} />}>
      <div className="flex items-center justify-between mb-8">
        <Title title={m['leagues.listTitle']()}/>

        <Link to="/leagues/new" className={cn(buttonVariants({variant: "default"}))}>
          {m['nav.createLeague']()}
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        {leagues.map((league) => (
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

      {leagues.length === 0 && (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>{m['leagues.listEmpty']()}</EmptyTitle>
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
