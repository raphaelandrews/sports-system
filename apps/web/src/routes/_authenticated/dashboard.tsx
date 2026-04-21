import { Outlet, createFileRoute } from "@tanstack/react-router";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { adminRequestsQueryOptions } from "@/queries/admin";
import { athleteListQueryOptions } from "@/queries/athletes";
import { delegationListQueryOptions } from "@/queries/delegations";
import { enrollmentListQueryOptions } from "@/queries/enrollments";
import { allEventsQueryOptions } from "@/queries/events";
import { notificationsQueryOptions } from "@/queries/notifications";
import { finalReportQueryOptions } from "@/queries/reports";
import { medalBoardQueryOptions } from "@/queries/results";
import { weekListQueryOptions } from "@/queries/weeks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: "data-only",
  loader: async ({ context: { queryClient, session } }) => {
    if (typeof document === "undefined") {
      return
    }

    const baseQueries = [
      queryClient.ensureQueryData(weekListQueryOptions()),
      queryClient.ensureQueryData(medalBoardQueryOptions()),
      queryClient.ensureQueryData(allEventsQueryOptions({ per_page: 12 })),
      queryClient.ensureQueryData(notificationsQueryOptions(session.id)),
    ]

    if (session.role === "ADMIN") {
      await Promise.all([
        ...baseQueries,
        queryClient.ensureQueryData(finalReportQueryOptions()),
        queryClient.ensureQueryData(delegationListQueryOptions()),
        queryClient.ensureQueryData(athleteListQueryOptions({ per_page: 1 })),
        queryClient.ensureQueryData(adminRequestsQueryOptions()),
      ])
      return
    }

    if (session.role === "CHIEF") {
      await Promise.all([
        ...baseQueries,
        queryClient.ensureQueryData(delegationListQueryOptions()),
        queryClient.ensureQueryData(athleteListQueryOptions({ per_page: 100 })),
        queryClient.ensureQueryData(enrollmentListQueryOptions()),
      ])
      return
    }

    await Promise.all(baseQueries)
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { session } = Route.useRouteContext();

  return (
    <DashboardLayout session={session}>
      <Outlet />
    </DashboardLayout>
  );
}
