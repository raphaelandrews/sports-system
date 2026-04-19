import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { sessionQueryOptions } from "../queries/auth";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient
      .fetchQuery(sessionQueryOptions())
      .catch(() => null);

    if (!session) {
      // TODO: redirect to "/login" once Phase 2 adds the login route
      throw redirect({ to: "/" });
    }

    return { session };
  },
  component: () => <Outlet />,
});
