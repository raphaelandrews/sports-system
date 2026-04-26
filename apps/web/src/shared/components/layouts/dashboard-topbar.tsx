import { useQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import {
  CirclePlusIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  SearchIcon,
  ShieldIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { SearchCommand } from "@/shared/components/layouts/search-command";
import {
  buildMembershipNav,
  buildPrimaryNav,
  buildWorkspaces,
  getLeagueIdFromPath,
  type ShellNavItem,
  type ShellScope,
} from "@/shared/components/layouts/shell-navigation";
import { leagueListQueryOptions, myLeaguesQueryOptions } from "@/features/leagues/api/queries";
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

function initialsFor(session: Session) {
  const displayName = session.name ?? session.email;
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getUtilityAction(args: {
  scope: ShellScope;
  leagueId?: string;
  hasMembership: boolean;
}): ShellNavItem | null {
  const { scope, leagueId, hasMembership } = args;

  if (leagueId && hasMembership) {
    return {
      href: `/leagues/${leagueId}/dashboard`,
      label: "Painel",
      icon: ShieldIcon,
      exact: scope === "league-authenticated",
    };
  }

  if (scope === "site-authenticated") {
    return {
      href: "/my-leagues",
      label: "Minhas ligas",
      icon: UsersIcon,
    };
  }

  return null;
}

export function DashboardTopbar({
  session,
  pathname,
  scope,
  league,
  membership,
}: DashboardTopbarProps) {
  const router = useRouter();
  const leaguesQuery = useQuery(leagueListQueryOptions());
  const myLeaguesQuery = useQuery({
    ...myLeaguesQueryOptions(),
    enabled: Boolean(session),
  });
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
  const navItems = buildPrimaryNav({
    scope,
    leagueId,
    membershipRole: membership?.role,
    platformRole,
  });
  const utilityAction = getUtilityAction({
    scope,
    leagueId,
    hasMembership: Boolean(session && membership),
  });
  const overflowItems = useMemo(() => {
    const blocked = new Set([
      ...navItems.map((item) => item.href),
      ...(utilityAction ? [utilityAction.href] : []),
    ]);

    return [...membershipNav.support, ...membershipNav.secondary].filter((item, index, list) => {
      if (blocked.has(item.href)) {
        return false;
      }
      return list.findIndex((candidate) => candidate.href === item.href) === index;
    });
  }, [membershipNav.secondary, membershipNav.support, navItems, utilityAction]);

  async function handleLogout() {
    await logoutFn();
    await router.invalidate();
    await router.navigate({ to: "/login" });
    toast.success("Sessão encerrada");
  }

  return (
    <nav className="flex min-w-0 items-center gap-3 px-3 py-2">
      <div className="hidden min-w-0 items-center gap-3 md:flex">
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
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-3 py-2">
                <Avatar className="size-8 border border-border">
                  <AvatarFallback className="text-xs">
                    {session ? initialsFor(session) : "SS"}
                  </AvatarFallback>
                </Avatar>
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
                  <DropdownMenuItem render={<Link to="/login" />}>
                    <UserCircleIcon size={16} strokeWidth={2} />
                    Entrar
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/register" />}>
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
              <DropdownMenuItem render={<Link to="/leagues" />}>
                <SearchIcon size={16} strokeWidth={2} />
                Explorar ligas
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="flex min-w-max items-center gap-0.5">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              render={
                <Link
                  to={item.href}
                  activeProps={{ className: "active" }}
                  activeOptions={{ exact: item.exact ?? false }}
                />
              }
              className="text-muted-foreground hover:bg-surface-1! [&.active]:hover:bg-surface-1 [&.active]:bg-surface-1 [&.active]:text-foreground"
            >
              <span className="flex items-center gap-2">
                <item.icon size={15} strokeWidth={2} />
                <span>{item.label}</span>
              </span>
            </Button>
          ))}
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-2 md:flex">
        <SearchCommand
          leagueId={leagueId}
          session={session}
          membershipRole={membership?.role}
          leagues={workspaceLeagues}
        />
        {utilityAction ? (
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                to={utilityAction.href}
                activeProps={{ className: "active" }}
                activeOptions={{ exact: utilityAction.exact ?? false }}
              />
            }
            className="gap-2 [&.active]:border-border [&.active]:bg-muted"
          >
            <utilityAction.icon size={15} strokeWidth={2} />
            {utilityAction.label}
          </Button>
        ) : null}
        <AnimatedThemeToggler
          variant="outline"
          size="icon"
          className="size-8 text-muted-foreground hover:bg-muted"
        />
        
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:bg-muted"
                aria-label="Mais ações"
              />
            }
          >
            <MoreHorizontalIcon className="size-5" strokeWidth={2} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {overflowItems.map((item) => (
              <DropdownMenuItem key={item.href} render={<a href={item.href} />}>
                <item.icon size={16} strokeWidth={2} />
                {item.label}
              </DropdownMenuItem>
            ))}
            {overflowItems.length > 0 &&
              ((session && !navItems.some((item) => item.href === "/leagues/new")) || !session) ? (
              <DropdownMenuSeparator />
            ) : null}
            {session && !navItems.some((item) => item.href === "/leagues/new") ? (
              <DropdownMenuItem render={<Link to="/leagues/new" />}>
                <CirclePlusIcon size={16} strokeWidth={2} />
                Criar liga
              </DropdownMenuItem>
            ) : null}
            {!session ? (
              <DropdownMenuItem render={<Link to="/login" />}>
                <UserCircleIcon size={16} strokeWidth={2} />
                Entrar
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
