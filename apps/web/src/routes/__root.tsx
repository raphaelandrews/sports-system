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

import { DashboardViewportLoading } from "@/components/layouts/dashboard-content-loading";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ErrorScreen } from "@/components/layouts/error-screen";
import { NotFoundScreen } from "@/components/layouts/not-found-screen";
import { getSessionFn } from "@/server/auth";

import appCss from "@/index.css?url";

const AUTH_PATHS = ["/login", "/register", "/auth/oauth/callback"];

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

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
          {isAuthPage ? (
            <Outlet />
          ) : (
            <DashboardLayout session={session ?? null}>
              <Outlet />
            </DashboardLayout>
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
