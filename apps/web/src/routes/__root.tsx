import { Toaster } from "@sports-system/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";

import { AppLayout } from "@/shared/components/layouts/app-layout";
import { DashboardViewportLoading } from "@/shared/components/layouts/dashboard-content-loading";
import { ErrorScreen } from "@/shared/components/layouts/error-screen";
import { NotFoundScreen } from "@/shared/components/layouts/not-found-screen";
import { getSessionFn } from "@/features/auth/server/auth";

import appCss from "@/index.css?url";

const SHELL_LESS_ROUTE_IDS = new Set(["/auth/oauth/callback"]);

export interface RouterAppContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    const session = await getSessionFn();
    return { session };
  },
  errorComponent: ErrorScreen,
  notFoundComponent: NotFoundScreen,
  pendingComponent: DashboardViewportLoading,

  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sports System" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  component: RootDocument,
});

function RootDocument() {
  const { session } = Route.useRouteContext();
  const routeIds = useRouterState({ select: (state) => state.matches.map((match) => match.routeId) });
  const isShellLessPage = routeIds.some((routeId) => SHELL_LESS_ROUTE_IDS.has(routeId));

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          themes={["light", "dark"]}
        >
          {isShellLessPage ? (
            <Outlet />
          ) : (
            <AppLayout session={session ?? null}>
              <Outlet />
            </AppLayout>
          )}
          <Toaster richColors />
          <ReactQueryDevtools buttonPosition="bottom-right" />
          <TanStackRouterDevtools position="bottom-left" />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}
