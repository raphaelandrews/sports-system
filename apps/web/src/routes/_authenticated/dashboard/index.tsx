import { createFileRoute } from "@tanstack/react-router";

import { DashboardHome } from "@/components/dashboard/dashboard-home";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  const { session } = Route.useRouteContext();

  return <DashboardHome session={session} />;
}
