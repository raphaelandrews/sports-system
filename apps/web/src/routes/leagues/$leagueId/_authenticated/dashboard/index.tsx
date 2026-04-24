import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { myLeagueMembershipQueryOptions } from "@/queries/leagues";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/")({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  const { session } = Route.useRouteContext();
  const { leagueId } = Route.useParams();
  const { data: membership } = useSuspenseQuery(myLeagueMembershipQueryOptions(leagueId));

  return <DashboardHome session={session!} leagueId={Number(leagueId)} membership={membership} />;
}
