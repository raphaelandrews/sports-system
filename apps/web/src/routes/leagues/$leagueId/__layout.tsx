import { Outlet, createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sports-system/ui/components/empty";
import { client, unwrap } from "@/shared/lib/api";

export const Route = createFileRoute("/leagues/$leagueId/__layout")({
  beforeLoad: async ({ params }) => {
    const league = await unwrap(
      client.GET("/leagues/{league_id}", {
        params: { path: { league_id: Number(params.leagueId) } },
      }),
    );
    return { league };
  },
  errorComponent: LeagueNotFound,
  component: () => <Outlet />,
});

function LeagueNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Empty className="max-w-sm">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPin />
          </EmptyMedia>
          <EmptyTitle>Liga não encontrada</EmptyTitle>
          <EmptyDescription>
            A liga que você está procurando não existe ou foi removida.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
