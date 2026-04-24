import { Outlet, createFileRoute } from "@tanstack/react-router";

import { adminRequestsQueryOptions } from "@/queries/admin";
import { activityFeedQueryOptions } from "@/queries/activities";
import { athleteListQueryOptions } from "@/queries/athletes";
import { delegationListQueryOptions } from "@/queries/delegations";
import { enrollmentListQueryOptions } from "@/queries/enrollments";
import { allEventsQueryOptions } from "@/queries/events";
import { notificationsQueryOptions } from "@/queries/notifications";
import { competitionListQueryOptions } from "@/queries/competitions";
import { finalReportQueryOptions } from "@/queries/reports";
import { medalBoardQueryOptions } from "@/queries/results";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: "data-only",
  loader: ({ context: { queryClient, session } }) => {
    if (typeof document === "undefined") {
      return
    }

    void queryClient.prefetchQuery(competitionListQueryOptions())
    void queryClient.prefetchQuery(medalBoardQueryOptions())
    void queryClient.prefetchQuery(allEventsQueryOptions({ per_page: 12 }))
    void queryClient.prefetchQuery(notificationsQueryOptions(session.id))

    if (session.role === "ADMIN") {
      void queryClient.prefetchQuery(activityFeedQueryOptions(6))
      void queryClient.prefetchQuery(finalReportQueryOptions())
      void queryClient.prefetchQuery(delegationListQueryOptions())
      void queryClient.prefetchQuery(athleteListQueryOptions({ per_page: 1 }))
      void queryClient.prefetchQuery(adminRequestsQueryOptions())
      return
    }

    if (session.role === "CHIEF") {
      void queryClient.prefetchQuery(delegationListQueryOptions())
      void queryClient.prefetchQuery(athleteListQueryOptions({ per_page: 100 }))
      void queryClient.prefetchQuery(enrollmentListQueryOptions())
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  return <Outlet />;
}
