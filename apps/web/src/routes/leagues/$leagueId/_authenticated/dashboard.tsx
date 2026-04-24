import { Outlet, createFileRoute } from "@tanstack/react-router";

import { athleteListQueryOptions } from "@/queries/athletes";
import { delegationListQueryOptions } from "@/queries/delegations";
import { allEventsQueryOptions } from "@/queries/events";
import { notificationsQueryOptions } from "@/queries/notifications";
import { competitionListQueryOptions } from "@/queries/competitions";
import { medalBoardQueryOptions } from "@/queries/results";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard")({
  ssr: "data-only",
  loader: ({ context: { queryClient, session }, params: { leagueId } }) => {
    if (typeof document === "undefined") {
      return;
    }

    void queryClient.prefetchQuery(competitionListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(medalBoardQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(allEventsQueryOptions(Number(leagueId), { per_page: 12 }));
    void queryClient.prefetchQuery(notificationsQueryOptions(session!.id));
    void queryClient.prefetchQuery(delegationListQueryOptions(Number(leagueId)));
    void queryClient.prefetchQuery(athleteListQueryOptions(Number(leagueId), { per_page: 100 }));
  },
  component: DashboardPage,
});

function DashboardPage() {
  return <Outlet />;
}
