import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-lg font-medium">Dashboard</h1>
    </div>
  );
}
