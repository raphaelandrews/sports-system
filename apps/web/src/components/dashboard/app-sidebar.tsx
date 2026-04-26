import * as React from "react";
import {
  BarChart3,
  CalendarDays,
  ChartColumn,
  Compass,
  Flag,
  Home,
  Medal,
  PlusCircle,
  Rss,
  Search,
  Shield,
  Settings,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { NavMain, type NavItem } from "@/components/dashboard/nav-main";
import { NavUser } from "@/components/dashboard/nav-user";
import { TeamSwitcher } from "@/components/dashboard/team-switcher";
import { leagueListQueryOptions, myLeagueMembershipQueryOptions } from "@/queries/leagues";
import type { LeagueMemberRole, LeagueResponse } from "@/types/leagues";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@sports-system/ui/components/sidebar";
import type { Session } from "@/types/auth";

type PlatformRole = Session["role"] | "SUPERADMIN" | "USER";

function buildPublicNav(leagueBase: string): NavItem[] {
  if (!leagueBase) {
    return [
      { title: "Início", url: "/", icon: Home },
      { title: "Ligas", url: "/leagues", icon: Trophy },
    ];
  }

  return [
    { title: "Início", url: leagueBase || "/", icon: Home },
    { title: "Competições", url: `${leagueBase}/competitions`, icon: CalendarDays },
    { title: "Resultados", url: `${leagueBase}/results`, icon: Medal },
    { title: "Feed ao vivo", url: `${leagueBase}/feed`, icon: Rss },
    { title: "Calendário", url: `${leagueBase}/calendar`, icon: CalendarDays },
    { title: "Delegações", url: `${leagueBase}/delegations`, icon: Flag },
    { title: "Esportes", url: `${leagueBase}/sports`, icon: Trophy },
  ];
}

function buildGlobalNav(): NavItem[] {
  return [
    { title: "Início", url: "/", icon: Home },
    { title: "Explorar ligas", url: "/leagues", icon: Compass },
    { title: "Minhas ligas", url: "/my-leagues", icon: Shield },
    { title: "Criar liga", url: "/leagues/new", icon: PlusCircle },
  ];
}

function buildMemberNav(dash: string, leagueBase: string): NavItem[] {
  return [
    { title: "Dashboard", url: dash, icon: Home },
    { title: "Busca", url: `${dash}/search`, icon: Search },
    { title: "Calendário", url: `${dash}/calendar`, icon: CalendarDays },
    { title: "Resultados", url: `${dash}/results`, icon: Medal },
    { title: "Delegações", url: `${dash}/delegations`, icon: Flag },
    { title: "Esportes", url: `${dash}/sports`, icon: Trophy },
    { title: "Feed ao vivo", url: `${leagueBase}/feed`, icon: Rss },
    { title: "Narrativa", url: `${leagueBase}/narrative`, icon: Sparkles },
  ];
}

function buildAdminNav(dash: string, leagueBase: string): NavItem[] {
  return [
    {
      title: "Administração",
      url: "#",
      icon: Settings,
      isActive: false,
      items: [
        { title: "Competições", url: `${dash}/competitions` },
        { title: "Calendário", url: `${dash}/calendar` },
        { title: "Delegações", url: `${dash}/delegations` },
        { title: "Esportes", url: `${dash}/sports` },
        { title: "Atletas", url: `${dash}/athletes` },
        { title: "Inscrições", url: `${dash}/enrollments` },
        { title: "Resultados", url: `${dash}/results` },
      ],
    },
    { title: "Geração IA", url: `${dash}/ai`, icon: Sparkles },
    { title: "Configurações", url: `${leagueBase}/settings`, icon: Settings },
    { title: "Relatório Final", url: `${leagueBase}/report`, icon: BarChart3 },
  ];
}

function buildChiefNav(dash: string): NavItem[] {
  return [
    { title: "Minha delegação", url: `${dash}/my-delegation`, icon: UserCheck },
    { title: "Membros", url: `${dash}/my-delegation/members`, icon: Shield },
    { title: "Convites", url: `${dash}/my-delegation/invite`, icon: PlusCircle },
    { title: "Transferências", url: `${dash}/my-delegation/transfers`, icon: Compass },
    { title: "Inscrições", url: `${dash}/enrollments`, icon: Medal },
    { title: "Atletas", url: `${dash}/athletes`, icon: UserCheck },
  ];
}

function buildSupportNav(role: PlatformRole, dash: string): NavItem[] | undefined {
  if (role === "SUPERADMIN") {
    return [
      { title: "Centro analítico", url: `${dash}/report`, icon: ChartColumn },
      { title: "Automação IA", url: `${dash}/ai`, icon: Sparkles },
    ];
  }
  if (role === "USER") {
    return [
      { title: "Calendário oficial", url: `${dash}/calendar`, icon: CalendarDays },
      { title: "Meu painel", url: dash, icon: Shield },
    ];
  }
  return undefined;
}

function buildMembershipNav(
  membershipRole: LeagueMemberRole | undefined,
  dash: string,
  leagueBase: string,
): { primary?: NavItem[]; secondary?: NavItem[] } {
  if (membershipRole === "LEAGUE_ADMIN") {
    return {
      primary: buildMemberNav(dash, leagueBase),
      secondary: buildAdminNav(dash, leagueBase),
    };
  }

  if (membershipRole === "CHIEF") {
    return {
      primary: buildMemberNav(dash, leagueBase),
      secondary: buildChiefNav(dash),
    };
  }

  if (membershipRole === "COACH" || membershipRole === "ATHLETE") {
    return {
      primary: buildMemberNav(dash, leagueBase),
      secondary: [{ title: "Relatório Final", url: `${leagueBase}/report`, icon: BarChart3 }],
    };
  }

  return {};
}

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();

  const leagueIdFromPath = pathname.match(/^\/leagues\/(\d+)/)?.[1];
  const leagueId = leagueIdFromPath ?? (() => {
    const cached = queryClient.getQueryData<LeagueResponse[]>(leagueListQueryOptions().queryKey);
    const def = cached?.find((l) => l.is_showcase) ?? cached?.[0];
    return def ? String(def.id) : undefined;
  })();

  const leagueBase = leagueId ? `/leagues/${leagueId}` : "";
  const dash = `${leagueBase}/dashboard`;
  const role = session?.role as PlatformRole | undefined;
  const membershipQuery = useQuery({
    ...myLeagueMembershipQueryOptions(leagueId ?? "0"),
    enabled: Boolean(session && leagueId),
    retry: false,
  });
  const membership = membershipQuery.data;
  const membershipNav = buildMembershipNav(membership?.role, dash, leagueBase);

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher session={session} leagueId={leagueId} />
      </SidebarHeader>

      <SidebarContent>
        {session ? (
          <>
            <NavMain items={buildGlobalNav()} label="Plataforma" />
            <NavMain items={membershipNav.primary} label={membership ? "Competição" : "Explorar"} />
            <NavMain
              items={membershipNav.secondary}
              label={membership?.role === "LEAGUE_ADMIN" ? "Administração" : "Minha área"}
            />
            <NavMain
              items={!membership ? buildPublicNav(leagueBase) : buildSupportNav(role ?? "USER", dash)}
              label={membership ? "Atalhos" : "Liga pública"}
            />
          </>
        ) : (
          <NavMain items={buildPublicNav(leagueBase)} label="Navegação" />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
