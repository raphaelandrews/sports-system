import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/leagues/$leagueId/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
