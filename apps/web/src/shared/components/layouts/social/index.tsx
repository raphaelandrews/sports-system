import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";

import {
  Home,
  Trophy,
  Shield,
  PlusCircle,
  Users,
  SquareDotIcon,
} from "lucide-react";

import { ApiError } from "@/shared/lib/api";
import { DashboardContentLoading } from "@/shared/components/layouts/dashboard-content-loading";
import {
  getLeagueIdFromPath,
  getShellScope,
  isMembershipFallbackError,
  buildPrimaryNav,
  buildMembershipNav,
} from "@/shared/components/layouts/shell-navigation";
import {
  leagueDetailQueryOptions,
  leagueListQueryOptions,
  myLeagueMembershipQueryOptions,
} from "@/features/leagues/api/queries";
import { SearchCommand } from "@/shared/components/layouts/search-command";
import { AnimatedThemeToggler } from "@/shared/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/shared/components/ui/notification-bell";
import { LocaleSwitcher } from "@/shared/components/ui/locale-switcher";
import { NavUser } from "@/shared/components/layouts/dashboard/nav-user";
import type { Session } from "@/types/auth";
import * as m from "@/paraglide/messages";

export function SocialLayout({
  session,
  children,
}: {
  session: Session | null;
  children?: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const leagueId = getLeagueIdFromPath(pathname);
  const scope = getShellScope(pathname, session);

  const leagueQuery = useQuery({
    ...leagueDetailQueryOptions(leagueId ?? "0"),
    enabled: Boolean(leagueId),
  });

  const membershipQuery = useQuery({
    ...myLeagueMembershipQueryOptions(leagueId ?? "0"),
    enabled: Boolean(session && leagueId),
    retry: false,
  });

  const allLeaguesQuery = useQuery({
    ...leagueListQueryOptions(),
  });

  const leagues = allLeaguesQuery.data ?? [];

  const membershipErrorStatus =
    membershipQuery.error instanceof ApiError ? membershipQuery.error.status : undefined;
  const membership =
    membershipQuery.isError && isMembershipFallbackError(membershipErrorStatus)
      ? undefined
      : membershipQuery.data;

  const platformRole = (session?.role as Session["role"] | undefined) ?? "USER";

  const membershipNav = buildMembershipNav({
    membershipRole: membership?.role,
    platformRole,
    leagueId,
  });

  const navItems = buildPrimaryNav({
    scope,
    leagueId,
    membershipRole: membership?.role,
    platformRole,
  });

  const leagueBase = leagueId ? `/leagues/${leagueId}` : "";
  const isLeagueSubRoute = (href: string) =>
    leagueId && href.startsWith(leagueBase);

  const mainItems = [
    {
      title: m["sidebar.home"](),
      url: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      title: m["sidebar.leagues"](),
      url: "/leagues",
      icon: Trophy,
      isActive: pathname === "/leagues" || pathname.startsWith("/leagues?"),
    },
    ...(session
      ? [
        {
          title: m["sidebar.myLeagues"](),
          url: "/my-leagues",
          icon: Shield,
          isActive: pathname === "/my-leagues" || pathname.startsWith("/my-leagues?"),
        },
        {
          title: m["sidebar.myDelegations"](),
          url: "/my-delegations",
          icon: Users,
          isActive: pathname === "/my-delegations" || pathname.startsWith("/my-delegations?"),
        },
        {
          title: m["sidebar.createLeague"](),
          url: "/leagues/new",
          icon: PlusCircle,
          isActive: pathname === "/leagues/new",
        },
      ]
      : []),
    ...navItems
      .filter(
        (item) =>
          !isLeagueSubRoute(item.href) &&
          item.href !== "/" &&
          item.href !== "/leagues" &&
          !(session && (item.href === "/my-leagues" || item.href === "/leagues/new")),
      )
      .map((item) => ({
        title: item.label,
        url: item.href,
        icon: item.icon,
        isActive: item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href),
      })),
  ];

  const secondaryItems = [
    ...navItems
      .filter((item) => isLeagueSubRoute(item.href))
      .map((item) => ({
        title: item.label,
        url: item.href,
        icon: item.icon,
        isActive: item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href),
      })),
    ...membershipNav.secondary.map((item) => ({
      title: item.label,
      url: item.href,
      icon: item.icon,
      isActive: item.exact
        ? pathname === item.href
        : pathname.startsWith(item.href),
    })),
  ];

  const breadcrumbTitle = leagueQuery.data
    ? leagueQuery.data.name
    : scope === "site-authenticated"
      ? m["header.siteTitle"]()
      : m["header.breadcrumbHome"]();

  const leagueIdStr = leagueQuery.data ? String(leagueQuery.data.id) : undefined;

  return (
    <div className="mx-auto flex min-h-screen max-w-480 bg-background lg:border-x lg:border-input">
      <aside className="sticky top-0 z-40 hidden h-screen w-65 shrink-0 flex-col border-r border-input bg-background lg:flex">
        <Link to="/" className="flex h-18 items-center gap-3 px-6 transition-opacity hover:opacity-80">
          <SquareDotIcon size={20} />
        </Link>

        <div className="flex flex-col p-4">
          <SearchCommand
            leagueId={leagueIdStr}
            session={session}
            membershipRole={membership?.role}
            leagues={leagues}
          />
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
          {mainItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`relative flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-card/50 hover:text-foreground ${item.isActive
                ? "bg-card text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
            >
              <item.icon size={18} />
              <span>{item.title}</span>
              {item.isActive && (
                <div className="absolute top-1.5 bottom-1.5 left-0 w-0.75 rounded-r-full bg-primary" />
              )}
            </Link>
          ))}

          {secondaryItems.length > 0 && (
            <>
              {secondaryItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`relative flex h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-card/50 hover:text-foreground ${item.isActive
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <item.icon size={18} />
                  <span>{item.title}</span>
                  {item.isActive && (
                    <div className="absolute top-1.5 bottom-1.5 left-0 w-0.75 rounded-r-full bg-primary" />
                  )}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div>
          <div className="flex items-start gap-2 p-4">
            <LocaleSwitcher />
            <AnimatedThemeToggler
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-muted"
            />
            {session ? <NotificationBell userId={session.id} /> : null}
          </div>

          {session ? (
            <div className="border-t border-input p-3">
              <NavUser session={session} />
            </div>
          ) : (
            <div className="flex flex-col border-t border-input p-4">
              <Link
                to="/login"
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {m["header.loginButton"]()}
              </Link>
            </div>
          )}
        </div>
      </aside >

      <header className="safe-top fixed inset-x-0 top-0 z-40 flex min-h-14 items-end justify-between px-4 pb-2 transition-all duration-300 ease-out lg:hidden translate-y-0 opacity-100 border-b border-transparent bg-background/90 backdrop-blur-md">
        <span className="text-sm font-medium">{breadcrumbTitle}</span>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          {session ? <NavUser session={session} /> : (
            <Link
              to="/login"
              className="inline-flex h-7 items-center justify-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {m["header.loginButton"]()}
            </Link>
          )}
        </div>
      </header>

      <div className="fixed inset-0 z-60 bg-black/60 transition-opacity duration-300 ease-out lg:hidden pointer-events-none opacity-0" />

      <main className="flex min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-out pt-[calc(3rem+env(safe-area-inset-top,0px))] lg:pt-0">
        <React.Suspense fallback={<DashboardContentLoading />}>
          {children}
        </React.Suspense>
      </main>
    </div >
  );
}
