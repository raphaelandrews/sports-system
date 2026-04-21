import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import Loader from "@/components/ui/loader";
import { RouteErrorComponent } from "@/components/ui/route-error";

import "@/index.css";
import { routeTree } from "@/routeTree.gen";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000, // 2 min default
        gcTime: 5 * 60 * 1000,
        retry: 1,
      },
    },
  });

export const getRouter = () => {
  const queryClient = createQueryClient();

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      scrollRestoration: true,
      defaultPreloadStaleTime: 0,
      context: { queryClient },
      defaultPendingComponent: () => <Loader />,
      defaultErrorComponent: ({ error, reset }) => (
        <RouteErrorComponent error={error} reset={reset} />
      ),
      defaultNotFoundComponent: () => <div>Not Found</div>,
      Wrap: ({ children }) => <>{children}</>,
    }),
    queryClient,
  );

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
