import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import * as m from "@/paraglide/messages";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";
import { Title } from "@/shared/components/ui/title";
import { PageLayout } from "@/shared/components/layouts/page-layout";
import { LeaguesSidebar } from "@/shared/components/ui/leagues-sidebar";
import { ActivityFeed, globalActivityFeedQueryOptions } from "@/features/activities";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(leagueListQueryOptions()),
      queryClient.ensureQueryData(globalActivityFeedQueryOptions(10)),
    ]),
  component: HomePage,
});

function HomePage() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());
  const { data: feedItems } = useSuspenseQuery(globalActivityFeedQueryOptions(10));

  return (
    <PageLayout sidebar={<LeaguesSidebar leagues={leagues} />}>
      <Title title={m['home.title']()} description={m['home.subtitle']()} />

      <ActivityFeed
        initialItems={feedItems}
        limit={10}
        live={true}
        title="Feed de atividades"
      />
    </PageLayout>
  );
}
