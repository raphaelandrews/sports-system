import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  CirclePlusIcon,
  ExternalLinkIcon,
  HomeIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  SearchIcon,
  SettingsIcon,
  ShieldIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { toast } from "sonner";

import { DashboardTabs } from "@/shared/components/layouts/dashboard-tabs";
import { SearchCommand } from "@/shared/components/layouts/search-command";
import {
  buildPrimaryNav,
  buildMembershipNav,
  buildWorkspaces,
  getLeagueIdFromPath,
  roleLabel,
  shellTitle,
  type ShellScope,
} from "@/shared/components/layouts/shell-navigation";
import { leagueListQueryOptions, myLeaguesQueryOptions } from "@/features/leagues/api/queries";
import { notificationsQueryOptions } from "@/features/notifications/api/queries";
import { logoutFn } from "@/features/auth/server/auth";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";
import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
import { Button } from "@sports-system/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import { AnimatedThemeToggler } from "../ui/animated-theme-toggler";

interface DashboardTopbarProps {
  session: Session | null;
  pathname: string;
  scope: ShellScope;
  league?: LeagueResponse;
  membership?: LeagueMemberResponse;
}

type NavItem = {
  to: string;
  label: string;
  icon: typeof HomeIcon;
  count?: number;
  dot?: boolean;
  exact?: boolean;
};

function initialsFor(session: Session) {
  const displayName = session.name ?? session.email;
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function topbarNavItems(args: {
  scope: ShellScope;
  pathname: string;
  league?: LeagueResponse;
  membership?: LeagueMemberResponse;
  unreadCount: number;
  platformRole?: Session["role"];
}): NavItem[] {
  const { scope, pathname, league, membership, unreadCount, platformRole } = args;
  const leagueId = league ? String(league.id) : getLeagueIdFromPath(pathname);
  const primary = buildPrimaryNav({
    scope,
    leagueId,
    membershipRole: membership?.role,
    platformRole: platformRole ?? "USER",
  });

  if (scope === "site-public") {
    return [
      { to: "/", label: "Início", icon: HomeIcon, exact: true },
      { to: "/leagues", label: "Ligas", icon: TrophyIcon },
    ];
  }

  if (scope === "site-authenticated") {
    return [
      { to: "/", label: "Início", icon: HomeIcon, exact: true },
      { to: "/leagues", label: "Explorar", icon: SearchIcon },
      { to: "/my-leagues", label: "Minhas ligas", icon: ShieldIcon },
      { to: "/leagues/new", label: "Criar liga", icon: CirclePlusIcon },
      { to: "/request-chief", label: "Solicitar chefe", icon: UsersIcon, dot: unreadCount > 0 },
    ];
  }

  return primary.slice(0, 5).map((item, index) => ({
    to: item.href,
    label: item.label,
    icon:
      index === 0
        ? HomeIcon
        : item.href.includes("/search")
          ? SearchIcon
          : item.href.includes("/deleg")
            ? UsersIcon
            : item.href.includes("/sport")
              ? TrophyIcon
              : ShieldIcon,
    exact: item.exact,
  }));
}

export function DashboardTopbar({
  session,
  pathname,
  scope,
  league,
  membership,
}: DashboardTopbarProps) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const notificationsQuery = useQuery({
    ...notificationsQueryOptions(session?.id ?? 0),
    enabled: Boolean(session),
  });
  const leaguesQuery = useQuery(leagueListQueryOptions());
  const myLeaguesQuery = useQuery({
    ...myLeaguesQueryOptions(),
    enabled: Boolean(session),
  });
  const unreadCount =
    notificationsQuery.data?.data.filter((notification) => !notification.read).length ?? 0;
  const tabsReady = true;
  const title = shellTitle({ scope, league });
  const leagueId = league ? String(league.id) : getLeagueIdFromPath(pathname);
  const platformRole = (session?.role as Session["role"] | undefined) ?? "USER";
  const membershipNav = buildMembershipNav({
    membershipRole: membership?.role,
    platformRole,
    leagueId,
  });
  const workspaceLeagues =
    session && myLeaguesQuery.data?.length ? myLeaguesQuery.data : (leaguesQuery.data ?? []);
  const workspaces = session
    ? buildWorkspaces({
        role: platformRole,
        leagues: workspaceLeagues,
        leagueId,
      })
    : [];
  const navItems = useMemo(
    () =>
      topbarNavItems({
        scope,
        pathname,
        league,
        membership,
        unreadCount,
        platformRole: session?.role,
      }),
    [scope, pathname, league, membership, unreadCount, session?.role],
  );

  async function handleLogout() {
    await logoutFn();
    await router.invalidate();
    await router.navigate({ to: "/login" });
    toast.success("Sessão encerrada");
  }

  return (
    <nav className="flex min-w-0 items-center gap-3 overflow-hidden px-3 py-2">
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex size-8 items-center justify-center rounded-full"
            aria-label="Abrir menu do perfil"
          >
            <Avatar className="size-7 border border-border">
              <AvatarFallback className="text-xs">
                {session ? initialsFor(session) : "SS"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-3 py-2">
                <Avatar className="size-8 border border-border">
                  <AvatarFallback className="text-xs">
                    {session ? initialsFor(session) : "SS"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {session?.name ?? title.title}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {session ? roleLabel(membership?.role ?? session.role) : title.subtitle}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {session ? (
                <>
                  {workspaces.map((workspace) => (
                    <DropdownMenuItem key={workspace.href} render={<a href={workspace.href} />}>
                      <workspace.icon size={16} strokeWidth={2} />
                      {workspace.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem render={<a href="/request-chief" />}>
                    <UsersIcon size={16} strokeWidth={2} />
                    Solicitar chefe
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem render={<a href="/login" />}>
                    <UserCircleIcon size={16} strokeWidth={2} />
                    Entrar
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<a href="/register" />}>
                    <CirclePlusIcon size={16} strokeWidth={2} />
                    Criar conta
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {session ? (
              <DropdownMenuItem onClick={() => void handleLogout()}>
                <LogOutIcon size={16} strokeWidth={2} />
                Sair
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem render={<a href="/leagues" />}>
                <SearchIcon size={16} strokeWidth={2} />
                Explorar ligas
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        aria-hidden={!tabsReady}
        className={`hidden shrink-0 items-center gap-0.5 transition-[opacity,transform] duration-300 ease-out md:flex ${
          tabsReady ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-0.5 opacity-0"
        }`}
      >
        {navItems.map((item) => (
          <Button
            key={item.label}
            variant="ghost"
            size="sm"
            render={
              <Link
                to={item.to}
                activeProps={{ className: "active" }}
                activeOptions={{ exact: item.exact ?? false }}
              />
            }
            className="text-muted-foreground hover:bg-surface-1! [&.active]:hover:bg-surface-1 [&.active]:bg-surface-1 [&.active]:text-foreground"
          >
            <span className="flex items-center gap-2">
              <item.icon size={15} strokeWidth={2} />
              <span>{item.label}</span>
              {item.dot ? (
                <span className="size-1.5 translate-y-px rounded-full bg-blue-500" />
              ) : typeof item.count === "number" ? (
                <span data-slot="tab-count" className="tabular-nums text-muted-foreground">
                  {item.count}
                </span>
              ) : null}
            </span>
          </Button>
        ))}
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <DashboardTabs tabsReady={tabsReady} routerRef={routerRef} />
      </div>

      <div className="hidden shrink-0 items-center gap-2 md:flex">
        {session ? (
          <SearchCommand
            leagueId={leagueId}
            session={session}
            membershipRole={membership?.role}
            leagues={workspaceLeagues}
          />
        ) : null}
        <AnimatedThemeToggler />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:bg-muted"
                aria-label="More actions"
              />
            }
          >
            <MoreHorizontalIcon className="size-5" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {membershipNav.secondary.slice(0, 4).map((item) => (
              <DropdownMenuItem key={item.href} render={<a href={item.href} />}>
                <item.icon size={16} strokeWidth={2} />
                {item.label}
              </DropdownMenuItem>
            ))}
            {membershipNav.support.slice(0, 3).map((item) => (
              <DropdownMenuItem key={item.href} render={<a href={item.href} />}>
                <item.icon size={16} strokeWidth={2} />
                {item.label}
              </DropdownMenuItem>
            ))}
            {membershipNav.secondary.length > 0 || membershipNav.support.length > 0 ? (
              <DropdownMenuSeparator />
            ) : null}
            {league ? (
              <DropdownMenuItem render={<a href={`/leagues/${league.id}`} />}>
                <ExternalLinkIcon size={16} strokeWidth={2} />
                Abrir liga
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem render={<a href="/leagues" />}>
              <SearchIcon size={16} strokeWidth={2} />
              Explorar ligas
            </DropdownMenuItem>
            {session ? (
              <DropdownMenuItem render={<a href="/leagues/new" />}>
                <CirclePlusIcon size={16} strokeWidth={2} />
                Criar liga
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<a href={league ? `/leagues/${league.id}` : "/"} />}>
              <SettingsIcon size={16} strokeWidth={2} />
              {league ? "Ver contexto atual" : "Voltar ao início"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
