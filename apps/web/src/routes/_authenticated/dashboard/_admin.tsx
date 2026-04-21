import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/_admin")({
  beforeLoad: ({ context }) => {
    if (context.session.role !== "ADMIN") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
