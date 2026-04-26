import {
  CirclePlusIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UserCircleIcon,
} from "lucide-react";
import type { ComponentType } from "react";
import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import { cn } from "@sports-system/ui/lib/utils";
import { Link, useRouter } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import {
  buildMembershipNav,
  buildPrimaryNav,
  buildWorkspaces,
  roleLabel,
  type ShellScope,
} from "@/shared/components/layouts/shell-navigation";
import { leagueListQueryOptions, myLeaguesQueryOptions } from "@/features/leagues/api/queries";
import { logoutFn } from "@/features/auth/server/auth";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";
import { useQuery } from "@tanstack/react-query";

const themeOptions = [
  { value: "light", icon: SunIcon, label: "Light" },
  { value: "dark", icon: MoonIcon, label: "Dark" },
  { value: "system", icon: MonitorIcon, label: "System" },
] as const;

interface MobileNavItem {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  count?: number;
  exact?: boolean;
}

function initialsFor(session: Session) {
  return session.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function mobileNavItems(args: {
  scope: ShellScope;
  league?: LeagueResponse;
  membership?: LeagueMemberResponse;
  platformRole?: Session["role"];
}): MobileNavItem[] {
  const { scope, league, membership, platformRole } = args;
  const items = buildPrimaryNav({
    scope,
    leagueId: league ? String(league.id) : undefined,
    membershipRole: membership?.role,
    platformRole: platformRole ?? "USER",
  });

  return items.map((item) => ({
    href: item.href,
    label: item.label,
    exact: item.exact,
    icon: item.icon,
  }));
}

export function DashboardMobileNav({
  session,
  scope,
  league,
  membership,
}: {
  session: Session | null;
  scope: ShellScope;
  league?: LeagueResponse;
  membership?: LeagueMemberResponse;
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const platformRole = (session?.role as Session["role"] | undefined) ?? "USER";
  const leagueId = league ? String(league.id) : undefined;
  const leaguesQuery = useQuery(leagueListQueryOptions());
  const myLeaguesQuery = useQuery({
    ...myLeaguesQueryOptions(),
    enabled: Boolean(session),
  });
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
  const navItems = mobileNavItems({ scope, league, membership, platformRole });
  const primaryItems = navItems.slice(0, 4);
  const overflowItems = [...navItems.slice(4), ...membershipNav.support, ...membershipNav.secondary]
    .filter((item, index, list) => list.findIndex((candidate) => candidate.href === item.href) === index);

  async function handleLogout() {
    await logoutFn();
    await router.invalidate();
    await router.navigate({ to: "/login" });
    toast.success("Sessão encerrada");
  }

  return (
    <nav className="flex items-stretch border-t border-border bg-card md:hidden">
      {primaryItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          activeOptions={{ exact: item.exact ?? false }}
          activeProps={{ className: "active" }}
          className={cn(
            "relative flex flex-1 items-center justify-center py-3 text-muted-foreground transition-colors",
            "[&.active]:bg-muted [&.active]:text-foreground",
          )}
        >
          <div className="relative">
            <item.icon size={22} strokeWidth={1.8} />
            {typeof item.count === "number" && item.count > 0 && (
              <span className="absolute -right-4 -top-1.5 flex size-4 items-center justify-center rounded-full bg-border text-[9px] font-medium leading-none text-muted-foreground tabular-nums">
                {item.count > 99 ? "+" : item.count}
              </span>
            )}
          </div>
        </Link>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex flex-1 items-center justify-center py-3 text-muted-foreground"
          aria-label="Abrir menu móvel"
        >
          {session ? (
            <Avatar className="size-6 border border-border" size="sm">
              <AvatarFallback className="text-[8px]">{initialsFor(session)}</AvatarFallback>
            </Avatar>
          ) : (
            <UserCircleIcon size={22} strokeWidth={1.8} />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between">
              <div>
                <p>{session?.name ?? "Sports System"}</p>
                <p className="font-normal text-muted-foreground">
                  {session ? roleLabel(membership?.role ?? session.role) : "Acesso visitante"}
                </p>
              </div>
              <div className="flex items-center gap-0.5 rounded-md border border-border/50 p-0.5">
                {themeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTheme(opt.value)}
                    className={cn(
                      "flex size-6 items-center justify-center rounded-sm transition-colors",
                      theme === opt.value
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    title={opt.label}
                  >
                    <opt.icon size={13} strokeWidth={2} />
                  </button>
                ))}
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
                {overflowItems.map((item) => (
                  <DropdownMenuItem key={item.href} render={<a href={item.href} />}>
                    <item.icon size={16} strokeWidth={2} />
                    {item.label}
                  </DropdownMenuItem>
                ))}
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

      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
