import { Outlet, createFileRoute } from "@tanstack/react-router";

import { apiFetch } from "@/lib/api";
import type { LeagueResponse } from "@/types/leagues";

export const Route = createFileRoute("/leagues/$leagueId/__layout")({
  beforeLoad: async ({ params }) => {
    const league = await apiFetch<LeagueResponse>(`/leagues/${params.leagueId}`);
    return { league };
  },
  errorComponent: LeagueNotFound,
  component: () => <Outlet />,
});

function LeagueNotFound() {
  return (
    <div className="container mx-auto px-4 py-10 text-center">
      <h1 className="text-2xl font-bold">League not found</h1>
      <p className="text-muted-foreground mt-2">The league you are looking for does not exist.</p>
    </div>
  );
}
