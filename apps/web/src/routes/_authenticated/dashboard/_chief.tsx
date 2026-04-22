import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard/_chief")({
  beforeLoad: ({ context }) => {
    if (context.session.role !== "CHIEF" && context.session.role !== "ADMIN") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <Outlet />,
});
