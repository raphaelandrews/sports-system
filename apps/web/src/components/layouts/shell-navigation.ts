import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarDays,
  Compass,
  Flag,
  Home,
  Medal,
  Newspaper,
  PlusCircle,
  Search,
  Shield,
  Sparkles,
  Trophy,
  UserCheck,
  UserRoundPlus,
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
    leagueSuffix.startsWith("/matches");

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

export function buildPrimaryNav(args: {
  scope: ShellScope;
  leagueId?: string;
  membershipRole?: LeagueMemberRole;
}): ShellNavItem[] {
  const { scope, leagueId, membershipRole } = args;
  const leagueBase = leagueId ? `/leagues/${leagueId}` : "";
  const dashBase = leagueId ? `${leagueBase}/dashboard` : "";

  if (scope === "league-public") {
    return [
      { href: leagueBase, label: "Visão geral", icon: Home, exact: true },
      { href: `${leagueBase}/competitions`, label: "Competições", icon: CalendarDays },
      { href: `${leagueBase}/results`, label: "Resultados", icon: Medal },
      { href: `${leagueBase}/calendar`, label: "Calendário", icon: CalendarDays },
      { href: `${leagueBase}/delegations`, label: "Delegações", icon: Flag },
      { href: `${leagueBase}/sports`, label: "Esportes", icon: Trophy },
      { href: `${leagueBase}/feed`, label: "Feed", icon: Newspaper },
      { href: `${leagueBase}/report`, label: "Relatório", icon: BarChart3 },
    ];
  }

  if (scope === "league-authenticated") {
    if (!membershipRole) {
      return buildPrimaryNav({ scope: "league-public", leagueId });
    }

    const baseItems: ShellNavItem[] = [
      { href: dashBase, label: "Dashboard", icon: Home, exact: true },
      { href: `${dashBase}/search`, label: "Busca", icon: Search },
      { href: `${dashBase}/calendar`, label: "Calendário", icon: CalendarDays },
      { href: `${dashBase}/results`, label: "Resultados", icon: Medal },
      { href: `${dashBase}/delegations`, label: "Delegações", icon: Flag },
      { href: `${dashBase}/sports`, label: "Esportes", icon: Trophy },
    ];

    if (membershipRole === "LEAGUE_ADMIN") {
      return [
        ...baseItems,
        { href: `${dashBase}/competitions`, label: "Competições", icon: Shield },
        { href: `${dashBase}/athletes`, label: "Atletas", icon: UserCheck },
        { href: `${dashBase}/enrollments`, label: "Inscrições", icon: Medal },
        { href: `${dashBase}/ai`, label: "IA", icon: Sparkles },
      ];
    }

    if (membershipRole === "CHIEF") {
      return [
        ...baseItems,
        { href: `${dashBase}/my-delegation`, label: "Minha delegação", icon: UserCheck },
        { href: `${dashBase}/enrollments`, label: "Inscrições", icon: Medal },
        { href: `${leagueBase}/narrative`, label: "Narrativa", icon: Sparkles },
      ];
    }

    return [...baseItems, { href: `${leagueBase}/narrative`, label: "Narrativa", icon: Sparkles }];
  }

  if (scope === "site-authenticated") {
    return [
      { href: "/", label: "Início", icon: Home, exact: true },
      { href: "/leagues", label: "Explorar ligas", icon: Compass },
      { href: "/my-leagues", label: "Minhas ligas", icon: Shield },
      { href: "/leagues/new", label: "Criar liga", icon: PlusCircle },
      { href: "/request-chief", label: "Solicitar chefe", icon: UserRoundPlus },
    ];
  }

  return [
    { href: "/", label: "Início", icon: Home, exact: true },
    { href: "/leagues", label: "Ligas", icon: Trophy },
  ];
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
