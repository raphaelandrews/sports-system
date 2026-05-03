import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Compass,
  Flag,
  Hand,
  Home,
  Medal,
  PlusCircle,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";

import * as m from "@/paraglide/messages";
import type { Session } from "@/types/auth";
import type { LeagueMemberRole, LeagueResponse } from "@/types/leagues";

export type ShellScope =
  | "site-public"
  | "site-authenticated"
  | "league-public"
  | "league-authenticated";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export type WorkspaceItem = {
  name: string;
  meta: string;
  icon: LucideIcon;
  href: string;
};

type PlatformRole = Session["role"] | "SUPERADMIN" | "USER";

export function getLeagueIdFromPath(pathname: string): string | undefined {
  return pathname.match(/^\/leagues\/(\d+)/)?.[1];
}

export function getShellScope(pathname: string, session: Session | null): ShellScope {
  const leagueId = getLeagueIdFromPath(pathname);

  if (!leagueId) {
    return session ? "site-authenticated" : "site-public";
  }

  const leagueSuffix = pathname.replace(new RegExp(`^/leagues/${leagueId}`), "") || "/";
  const isAuthenticatedLeagueArea =
    leagueSuffix.startsWith("/dashboard") ||
    leagueSuffix.startsWith("/narrative") ||
    leagueSuffix.startsWith("/athletes") ||
    leagueSuffix.startsWith("/matches") ||
    leagueSuffix.startsWith("/settings");

  if (session && isAuthenticatedLeagueArea) {
    return "league-authenticated";
  }

  return "league-public";
}

export function isMembershipFallbackError(status: number | undefined) {
  return status === 403 || status === 404;
}

export function roleLabel(
  role: Session["role"] | LeagueMemberRole | undefined,
): string | undefined {
  if (!role) return undefined;

  const labels: Record<Session["role"] | LeagueMemberRole, string> = {
    SUPERADMIN: m['roles.superadmin'](),
    USER: m['roles.user'](),
    ADMIN: m['roles.admin'](),
    CHIEF: m['roles.chief'](),
    COACH: m['roles.coach'](),
    ATHLETE: m['roles.athlete'](),
    LEAGUE_ADMIN: m['roles.leagueAdmin'](),
  };

  return labels[role];
}

function buildPublicNav(leagueBase: string): ShellNavItem[] {
  if (!leagueBase) {
    return [
      { href: "/", label: m['nav.home'](), icon: Home, exact: true },
      { href: "/leagues", label: m['nav.leagues'](), icon: Trophy },
    ];
  }

  return [
    { href: leagueBase, label: m['nav.overview'](), icon: Home, exact: true },
    { href: `${leagueBase}/competitions`, label: m['nav.competitions'](), icon: CalendarDays },
    { href: `${leagueBase}/results`, label: m['nav.results'](), icon: Medal },
    { href: `${leagueBase}/calendar`, label: m['nav.calendar'](), icon: CalendarDays },
    { href: `${leagueBase}/delegations`, label: m['nav.delegations'](), icon: Flag },
    { href: `${leagueBase}/sports`, label: m['nav.sports'](), icon: Trophy },
  ];
}

function buildGlobalNav(): ShellNavItem[] {
  return [
    { href: "/", label: m['nav.home'](), icon: Home, exact: true },
    { href: "/leagues", label: m['nav.exploreLeagues'](), icon: Compass },
    { href: "/my-leagues", label: m['nav.myLeagues'](), icon: Shield },
    { href: "/leagues/new", label: m['nav.createLeague'](), icon: PlusCircle },
  ];
}

function buildMemberNav(dash: string): ShellNavItem[] {
  return [
    { href: `${dash}/calendar`, label: m['nav.operationalCalendar'](), icon: CalendarDays },
    { href: `${dash}/results`, label: m['nav.operateResults'](), icon: Medal },
  ];
}

function buildAdminNav(dash: string, leagueBase: string): ShellNavItem[] {
  return [
    { href: `${dash}/competitions`, label: m['nav.admin.competitions'](), icon: Settings },
    { href: `${dash}/athletes`, label: m['nav.admin.athletes'](), icon: UserCheck },
    { href: `${dash}/enrollments`, label: m['nav.admin.enrollments'](), icon: Medal },
    { href: `${dash}/participation-requests`, label: m['nav.admin.requests'](), icon: Hand },
    { href: `${dash}/ai`, label: m['nav.admin.ai'](), icon: Sparkles },
    { href: `${leagueBase}/settings`, label: m['nav.admin.settings'](), icon: Settings },
    { href: `${leagueBase}/report`, label: m['nav.admin.report'](), icon: BarChart3 },
  ];
}

function buildChiefNav(dash: string): ShellNavItem[] {
  return [
    { href: `${dash}/my-delegation`, label: m['nav.chief.myDelegation'](), icon: UserCheck },
    { href: `${dash}/my-delegation/members`, label: m['nav.chief.members'](), icon: Shield },
    { href: `${dash}/my-delegation/invite`, label: m['nav.chief.invites'](), icon: PlusCircle },
    { href: `${dash}/my-delegation/transfers`, label: m['nav.chief.transfers'](), icon: Compass },
    { href: `${dash}/enrollments`, label: m['nav.chief.enrollments'](), icon: Medal },
    { href: `${dash}/athletes`, label: m['nav.chief.athletes'](), icon: UserCheck },
  ];
}


export function buildMembershipNav(args: {
  membershipRole?: LeagueMemberRole;
  platformRole?: PlatformRole;
  leagueId?: string;
}): { primary: ShellNavItem[]; secondary: ShellNavItem[];} {
  const { membershipRole, leagueId } = args;
  const leagueBase = leagueId ? `/leagues/${leagueId}` : "";
  const dash = leagueId ? `${leagueBase}/dashboard` : "";

  if (!leagueId) {
    return { primary: [], secondary: [] };
  }

  if (membershipRole === "LEAGUE_ADMIN") {
    return {
      primary: buildPublicNav(leagueBase),
      secondary: buildAdminNav(dash, leagueBase),
    };
  }

  if (membershipRole === "CHIEF") {
    return {
      primary: buildPublicNav(leagueBase),
      secondary: buildChiefNav(dash),
    };
  }

  if (membershipRole === "COACH" || membershipRole === "ATHLETE") {
    return {
      primary: buildPublicNav(leagueBase),
      secondary: buildMemberNav(dash),
    };
  }

  if (leagueId) {
    return {
      primary: buildPublicNav(leagueBase),
      secondary: [],
    };
  }

  return {
    primary: buildPublicNav(leagueBase),
    secondary: [],
  };
}

export function buildPrimaryNav(args: {
  scope: ShellScope;
  leagueId?: string;
  membershipRole?: LeagueMemberRole;
  platformRole?: PlatformRole;
}): ShellNavItem[] {
  const { scope, leagueId, membershipRole, platformRole } = args;
  const leagueBase = leagueId ? `/leagues/${leagueId}` : "";

  if (scope === "league-public") {
    return buildPublicNav(leagueBase);
  }

  if (scope === "league-authenticated") {
    return buildMembershipNav({ membershipRole, platformRole, leagueId }).primary;
  }

  if (scope === "site-authenticated") {
    return buildGlobalNav();
  }

  return buildPublicNav("");
}

export function buildQuickActions(args: {
  scope: ShellScope;
  leagueId?: string;
  membershipRole?: LeagueMemberRole;
  session: Session | null;
}): ShellNavItem[] {
  const { scope, leagueId, membershipRole, session } = args;
  const leagueBase = leagueId ? `/leagues/${leagueId}` : "";
  const dashBase = leagueId ? `${leagueBase}/dashboard` : "";

  if (scope === "league-authenticated" && membershipRole === "LEAGUE_ADMIN") {
    return [
      { href: `${dashBase}/competitions/new`, label: m['nav.quick.newCompetition'](), icon: PlusCircle },
    ];
  }

  if (scope === "league-authenticated" && membershipRole === "CHIEF") {
    return [
      { href: `${dashBase}/my-delegation`, label: m['nav.chief.myDelegation'](), icon: UserCheck },
    ];
  }

  if (scope === "site-authenticated") {
    return [
      { href: "/my-leagues", label: m['nav.myLeagues'](), icon: Shield },
      { href: "/leagues/new", label: m['nav.createLeague'](), icon: PlusCircle },
    ];
  }

  if (!session) {
    return [
      { href: "/login", label: m['nav.quick.login'](), icon: Shield },
      { href: "/register", label: m['nav.quick.register'](), icon: PlusCircle },
    ];
  }

  return [];
}

export function buildWorkspaces(args: {
  role: PlatformRole;
  leagues: LeagueResponse[];
  leagueId?: string;
}): WorkspaceItem[] {
  const { role, leagues, leagueId } = args;
  const currentLeague = leagues.find((league) => String(league.id) === leagueId);

  if (currentLeague) {
    return [
      {
        name: currentLeague.name,
        meta: currentLeague.timezone,
        icon: Trophy,
        href: `/leagues/${currentLeague.id}`,
      },
      {
        name: m['nav.workspace.leaguePanel'](),
        meta: m['nav.meta.catalog'](),
        icon: Shield,
        href: `/leagues/${currentLeague.id}/dashboard`,
      },
    ];
  }

  const base: WorkspaceItem[] = [
    { name: m['nav.workspace.explore'](), meta: m['nav.meta.catalog'](), icon: Compass, href: "/leagues" },
    { name: m['nav.workspace.myLeagues'](), meta: m['nav.meta.shortcuts'](), icon: Shield, href: "/my-leagues" },
  ];

  if (role === "SUPERADMIN") {
    return [{ name: m['nav.workspace.admin'](), meta: "Operação geral", icon: Sparkles, href: "/" }, ...base];
  }

  return [{ name: m['nav.workspace.personal'](), meta: m['nav.meta.overview'](), icon: Sparkles, href: "/" }, ...base];
}
