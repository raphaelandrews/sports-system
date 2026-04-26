import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { client, unwrap } from "@/shared/lib/api";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/_league_admin")({
  beforeLoad: async ({ params, context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
    const membership = await unwrap(
      client.GET("/leagues/{league_id}/members/me", {
        params: { path: { league_id: Number(params.leagueId) } },
      }),
    );
    if (membership.role !== "LEAGUE_ADMIN") {
      throw redirect({ to: "/leagues/$leagueId", params: { leagueId: params.leagueId } });
    }
    return { membership };
  },
  component: () => <Outlet />,
});
