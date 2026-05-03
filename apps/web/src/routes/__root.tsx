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

import { getLocale } from "@/paraglide/runtime";
import { m } from "@/paraglide/messages";
import { DashboardViewportLoading } from "@/shared/components/layouts/dashboard-content-loading";
import { SocialLayout } from "@/shared/components/layouts/social";
import { ErrorScreen } from "@/shared/components/layouts/error-screen";
import { NotFoundScreen } from "@/shared/components/layouts/not-found-screen";
import { getSessionFn } from "@/features/auth/server/auth";

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
      { title: m.app_title() },
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
    <html lang={getLocale()} suppressHydrationWarning>
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
            <SocialLayout session={session ?? null}>
              <Outlet />
            </SocialLayout>
          )}
          <Toaster richColors />
          <ReactQueryDevtools buttonPosition="bottom-right" />
          <TanStackRouterDevtools position="top-right" />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}
