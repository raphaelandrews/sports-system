import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated/dashboard/")({
  component: DashboardIndexPage,
});

function DashboardIndexPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-muted-foreground">Dashboard</p>
    </div>
  );
}
