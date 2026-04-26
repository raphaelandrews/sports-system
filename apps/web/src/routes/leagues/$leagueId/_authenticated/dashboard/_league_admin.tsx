import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { apiFetch } from "@/shared/lib/api";
import type { LeagueMemberResponse } from "@/types/leagues";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/_league_admin")({
  beforeLoad: async ({ params, context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
    const membership = await apiFetch<LeagueMemberResponse>(
      `/leagues/${params.leagueId}/members/me`,
    );
    if (membership.role !== "LEAGUE_ADMIN") {
      throw redirect({ to: "/leagues/$leagueId", params: { leagueId: params.leagueId } });
    }
    return { membership };
  },
  component: () => <Outlet />,
});
