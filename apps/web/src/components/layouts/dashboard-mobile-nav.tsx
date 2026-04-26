import {
  CirclePlusIcon,
  HomeIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SearchIcon,
  ShieldIcon,
  SunIcon,
  TrophyIcon,
  UserCircleIcon,
  UsersIcon,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@sports-system/ui/components/avatar";
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

import { buildPrimaryNav, roleLabel, type ShellScope } from "@/components/layouts/shell-navigation";
import { logoutFn } from "@/server/auth";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";

const themeOptions = [
  { value: "light", icon: SunIcon, label: "Light" },
  { value: "dark", icon: MoonIcon, label: "Dark" },
  { value: "system", icon: MonitorIcon, label: "System" },
] as const;

interface MobileNavItem {
  to: string;
  label: string;
  icon: typeof HomeIcon;
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
}): MobileNavItem[] {
  const { scope, league, membership } = args;
  const items = buildPrimaryNav({
    scope,
    leagueId: league ? String(league.id) : undefined,
    membershipRole: membership?.role,
  });

  if (scope === "site-public") {
    return [
      { to: "/", label: "Home", icon: HomeIcon, exact: true },
      { to: "/leagues", label: "Leagues", icon: TrophyIcon },
    ];
  }

  if (scope === "site-authenticated") {
    return [
      { to: "/", label: "Home", icon: HomeIcon, exact: true },
      { to: "/leagues", label: "Explore", icon: SearchIcon },
      { to: "/my-leagues", label: "Mine", icon: ShieldIcon },
      { to: "/leagues/new", label: "Create", icon: CirclePlusIcon },
      { to: "/request-chief", label: "Chief", icon: UsersIcon },
    ];
  }

  return items.slice(0, 5).map((item, index) => ({
    to: item.href,
    label: item.label,
    exact: item.exact,
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
  const tabsReady = true;

  const navItems = mobileNavItems({ scope, league, membership });

  async function handleLogout() {
    await logoutFn();
    await router.invalidate();
    await router.navigate({ to: "/login" });
    toast.success("Sessão encerrada");
  }

  return (
    <nav className="flex items-stretch border-t border-border bg-card md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact ?? false }}
          activeProps={{ className: "active" }}
          className={cn(
            "relative flex flex-1 items-center justify-center py-3 text-muted-foreground transition-colors",
            "[&.active]:bg-muted [&.active]:text-foreground",
            !tabsReady && "pointer-events-none opacity-0",
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
          aria-label="Open mobile menu"
        >
          {session ? (
            <Avatar className="size-6 border border-border" size="sm">
              <AvatarFallback className="text-[8px]">
                {initialsFor(session)}
              </AvatarFallback>
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
                  {session ? roleLabel(membership?.role ?? session.role) : "Guest access"}
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
                <DropdownMenuItem render={<Link to="/my-leagues" />}>
                  <UserCircleIcon size={16} strokeWidth={2} />
                  My leagues
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/request-chief" />}>
                  <UsersIcon size={16} strokeWidth={2} />
                  Request chief
                </DropdownMenuItem>
                {league ? (
                  <DropdownMenuItem render={<a href={`/leagues/${league.id}`} />}>
                    <TrophyIcon size={16} strokeWidth={2} />
                    League page
                  </DropdownMenuItem>
                ) : null}
              </>
            ) : (
              <>
                <DropdownMenuItem render={<Link to="/login" />}>
                  <UserCircleIcon size={16} strokeWidth={2} />
                  Sign in
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link to="/register" />}>
                  <CirclePlusIcon size={16} strokeWidth={2} />
                  Create account
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          {session ? (
            <DropdownMenuItem onClick={() => void handleLogout()}>
              <LogOutIcon size={16} strokeWidth={2} />
              Sign out
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem render={<Link to="/leagues" />}>
              <SearchIcon size={16} strokeWidth={2} />
              Explore leagues
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="pb-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
