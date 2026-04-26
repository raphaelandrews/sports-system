import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  ChartColumn,
  Compass,
  Flag,
  Home,
  Medal,
  Newspaper,
  PlusCircle,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";

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
    SUPERADMIN: "Administrador",
    USER: "Usuário",
    ADMIN: "Administrador",
    CHIEF: "Chefe",
    COACH: "Técnico",
    ATHLETE: "Atleta",
    LEAGUE_ADMIN: "Admin da liga",
  };

  return labels[role];
}

function buildPublicNav(leagueBase: string): ShellNavItem[] {
  if (!leagueBase) {
    return [
      { href: "/", label: "Início", icon: Home, exact: true },
      { href: "/leagues", label: "Ligas", icon: Trophy },
    ];
  }

  return [
    { href: leagueBase, label: "Início", icon: Home, exact: true },
    { href: `${leagueBase}/competitions`, label: "Competições", icon: CalendarDays },
    { href: `${leagueBase}/results`, label: "Resultados", icon: Medal },
    { href: `${leagueBase}/feed`, label: "Feed ao vivo", icon: Newspaper },
    { href: `${leagueBase}/calendar`, label: "Calendário", icon: CalendarDays },
    { href: `${leagueBase}/delegations`, label: "Delegações", icon: Flag },
    { href: `${leagueBase}/sports`, label: "Esportes", icon: Trophy },
  ];
}

function buildGlobalNav(): ShellNavItem[] {
  return [
    { href: "/", label: "Início", icon: Home, exact: true },
    { href: "/leagues", label: "Explorar ligas", icon: Compass },
    { href: "/my-leagues", label: "Minhas ligas", icon: Shield },
    { href: "/leagues/new", label: "Criar liga", icon: PlusCircle },
  ];
}

function buildMemberNav(dash: string, leagueBase: string): ShellNavItem[] {
  return [
    { href: dash, label: "Dashboard", icon: Home, exact: true },
    { href: `${dash}/calendar`, label: "Calendário", icon: CalendarDays },
    { href: `${dash}/results`, label: "Resultados", icon: Medal },
    { href: `${dash}/delegations`, label: "Delegações", icon: Flag },
    { href: `${dash}/sports`, label: "Esportes", icon: Trophy },
    { href: `${leagueBase}/feed`, label: "Feed ao vivo", icon: Newspaper },
    { href: `${leagueBase}/narrative`, label: "Narrativa", icon: Sparkles },
  ];
}

function buildAdminNav(dash: string, leagueBase: string): ShellNavItem[] {
  return [
    { href: `${dash}/competitions`, label: "Competições", icon: Settings },
    { href: `${dash}/calendar`, label: "Calendário admin", icon: CalendarDays },
    { href: `${dash}/delegations`, label: "Delegações admin", icon: Flag },
    { href: `${dash}/sports`, label: "Esportes admin", icon: Trophy },
    { href: `${dash}/athletes`, label: "Atletas", icon: UserCheck },
    { href: `${dash}/enrollments`, label: "Inscrições", icon: Medal },
    { href: `${dash}/results`, label: "Resultados admin", icon: Medal },
    { href: `${dash}/ai`, label: "Geração IA", icon: Sparkles },
    { href: `${leagueBase}/settings`, label: "Configurações", icon: Settings },
    { href: `${leagueBase}/report`, label: "Relatório Final", icon: BarChart3 },
  ];
}

function buildChiefNav(dash: string): ShellNavItem[] {
  return [
    { href: `${dash}/my-delegation`, label: "Minha delegação", icon: UserCheck },
    { href: `${dash}/my-delegation/members`, label: "Membros", icon: Shield },
    { href: `${dash}/my-delegation/invite`, label: "Convites", icon: PlusCircle },
    { href: `${dash}/my-delegation/transfers`, label: "Transferências", icon: Compass },
    { href: `${dash}/enrollments`, label: "Inscrições", icon: Medal },
    { href: `${dash}/athletes`, label: "Atletas", icon: UserCheck },
  ];
}

function buildSupportNav(role: PlatformRole, dash: string): ShellNavItem[] {
  if (role === "SUPERADMIN") {
    return [
      { href: `${dash}/report`, label: "Centro analítico", icon: ChartColumn },
      { href: `${dash}/ai`, label: "Automação IA", icon: Sparkles },
    ];
  }
  if (role === "USER") {
    return [
      { href: `${dash}/calendar`, label: "Calendário oficial", icon: CalendarDays },
      { href: dash, label: "Meu painel", icon: Shield },
    ];
  }
  return [];
}

export function buildMembershipNav(args: {
  membershipRole?: LeagueMemberRole;
  platformRole?: PlatformRole;
  leagueId?: string;
}): { primary: ShellNavItem[]; secondary: ShellNavItem[]; support: ShellNavItem[] } {
  const { membershipRole, platformRole, leagueId } = args;
  const leagueBase = leagueId ? `/leagues/${leagueId}` : "";
  const dash = leagueId ? `${leagueBase}/dashboard` : "";

  if (!leagueId) {
    return { primary: [], secondary: [], support: [] };
  }

  if (membershipRole === "LEAGUE_ADMIN") {
    return {
      primary: buildMemberNav(dash, leagueBase),
      secondary: buildAdminNav(dash, leagueBase),
      support: buildSupportNav(platformRole ?? "USER", dash),
    };
  }

  if (membershipRole === "CHIEF") {
    return {
      primary: buildMemberNav(dash, leagueBase),
      secondary: buildChiefNav(dash),
      support: buildSupportNav(platformRole ?? "USER", dash),
    };
  }

  if (membershipRole === "COACH" || membershipRole === "ATHLETE") {
    return {
      primary: buildMemberNav(dash, leagueBase),
      secondary: [{ href: `${leagueBase}/report`, label: "Relatório Final", icon: BarChart3 }],
      support: buildSupportNav(platformRole ?? "USER", dash),
    };
  }

  return {
    primary: [],
    secondary: [],
    support: buildPublicNav(leagueBase),
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
      { href: `${dashBase}/competitions/new`, label: "Nova competição", icon: PlusCircle },
      { href: `${leagueBase}/settings`, label: "Configurações", icon: Shield },
    ];
  }

  if (scope === "league-authenticated" && membershipRole === "CHIEF") {
    return [
      { href: `${dashBase}/my-delegation/invite`, label: "Convidar", icon: PlusCircle },
      { href: `${dashBase}/my-delegation/transfers`, label: "Transferências", icon: Compass },
    ];
  }

  if (scope === "site-authenticated") {
    return [
      { href: "/my-leagues", label: "Minhas ligas", icon: Shield },
      { href: "/leagues/new", label: "Criar liga", icon: PlusCircle },
    ];
  }

  if (!session) {
    return [
      { href: "/login", label: "Entrar", icon: Shield },
      { href: "/register", label: "Criar conta", icon: PlusCircle },
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
        meta: currentLeague.is_showcase ? "Showcase" : currentLeague.timezone,
        icon: currentLeague.is_showcase ? Sparkles : Trophy,
        href: `/leagues/${currentLeague.id}`,
      },
      {
        name: "Painel da liga",
        meta: "Área autenticada",
        icon: Shield,
        href: `/leagues/${currentLeague.id}/dashboard`,
      },
    ];
  }

  const base: WorkspaceItem[] = [
    { name: "Explorar ligas", meta: "Catálogo público", icon: Compass, href: "/leagues" },
    { name: "Minhas ligas", meta: "Acessos rápidos", icon: Shield, href: "/my-leagues" },
  ];

  if (role === "SUPERADMIN") {
    return [{ name: "Central Admin", meta: "Operação geral", icon: Sparkles, href: "/" }, ...base];
  }

  return [{ name: "Painel pessoal", meta: "Visão geral", icon: Sparkles, href: "/" }, ...base];
}

export function shellTitle(args: {
  scope: ShellScope;
  league?: LeagueResponse;
}): { title: string; subtitle: string } {
  const { scope, league } = args;

  if (league) {
    return {
      title: league.name,
      subtitle:
        scope === "league-authenticated"
          ? "Área operacional da liga"
          : "Acompanhamento público da competição",
    };
  }

  if (scope === "site-authenticated") {
    return {
      title: "Sports System",
      subtitle: "Operação e acompanhamento de ligas",
    };
  }

  return {
    title: "Sports System",
    subtitle: "Descubra e acompanhe ligas esportivas",
  };
}
