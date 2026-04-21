import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context }) => {
    if (!context.session) {
      // Phase 2 will add /login — update `to` then
      throw redirect({ to: "/login" });
    }
    return { session: context.session };
  },
  component: () => <Outlet />,
});
