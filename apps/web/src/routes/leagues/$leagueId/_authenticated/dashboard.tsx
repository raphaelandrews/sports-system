import { Outlet, createFileRoute } from "@tanstack/react-router";

import { athleteListQueryOptions } from "@/features/athletes/api/queries";
import { delegationListQueryOptions } from "@/features/delegations/api/queries";
import { allEventsQueryOptions } from "@/features/events/api/queries";
import { notificationsQueryOptions } from "@/features/notifications/api/queries";
import { competitionListQueryOptions } from "@/features/competitions/api/queries";
import { medalBoardQueryOptions } from "@/features/results/api/queries";

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
