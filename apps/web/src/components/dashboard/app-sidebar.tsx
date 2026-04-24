import * as React from "react";
import {
  BarChart3,
  CalendarDays,
  ChartColumn,
  Flag,
  Home,
  Medal,
  Rss,
  Search,
  Shield,
  Settings,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";

import { NavMain, type NavItem } from "@/components/dashboard/nav-main";
import { NavUser } from "@/components/dashboard/nav-user";
import { TeamSwitcher } from "@/components/dashboard/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@sports-system/ui/components/sidebar";
import type { Session } from "@/types/auth";

type PlatformRole = Session["role"] | "SUPERADMIN" | "USER";

const publicNav: NavItem[] = [
  { title: "Início", url: "/", icon: Home },
  { title: "Competições", url: "/competitions", icon: CalendarDays },
  { title: "Resultados", url: "/results", icon: Medal },
  { title: "Feed ao vivo", url: "/feed", icon: Rss },
  { title: "Calendário", url: "/calendar", icon: CalendarDays },
  { title: "Delegações", url: "/delegations", icon: Flag },
  { title: "Esportes", url: "/sports", icon: Trophy },
];

const commonNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Busca", url: "/dashboard/search", icon: Search },
  { title: "Calendário", url: "/dashboard/calendar", icon: CalendarDays },
  { title: "Resultados", url: "/dashboard/results", icon: Medal },
  { title: "Delegações", url: "/dashboard/delegations", icon: Flag },
  { title: "Esportes", url: "/dashboard/sports", icon: Trophy },
];

const adminNav: NavItem[] = [
  {
    title: "Administração",
    url: "#",
    icon: Settings,
    isActive: false,
    items: [
      { title: "Competições", url: "/dashboard/competitions" },
      { title: "Calendário", url: "/dashboard/calendar" },
      { title: "Delegações", url: "/dashboard/delegations" },
      { title: "Esportes", url: "/dashboard/sports" },
      { title: "Atletas", url: "/dashboard/athletes" },
      { title: "Inscrições", url: "/dashboard/enrollments" },
      { title: "Resultados", url: "/dashboard/results" },
      { title: "Solicitações", url: "/dashboard/requests" },
    ],
  },
  { title: "Geração IA", url: "/dashboard/ai", icon: Sparkles },
  { title: "Relatório Final", url: "/report", icon: BarChart3 },
];

const athleteNav: NavItem[] = [
  { title: "Minhas partidas", url: "/dashboard/my-matches", icon: CalendarDays },
  { title: "Meu perfil atleta", url: "/dashboard/my-profile", icon: UserCheck },
];

const supportNav: Partial<Record<PlatformRole, NavItem[]>> = {
  SUPERADMIN: [
    { title: "Centro analítico", url: "/report", icon: ChartColumn },
    { title: "Automação IA", url: "/dashboard/ai", icon: Sparkles },
  ],
  USER: [
    { title: "Calendário oficial", url: "/dashboard/calendar", icon: CalendarDays },
    { title: "Meu painel", url: "/dashboard", icon: Shield },
  ],
};

function getNavItems(role: PlatformRole): NavItem[] {
  if (role === "SUPERADMIN") return adminNav;
  return athleteNav;
}

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session | null }) {
  const role = session?.role as PlatformRole | undefined;

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher session={session} />
      </SidebarHeader>

      <SidebarContent>
        {session ? (
          <>
            <NavMain items={commonNav} label="Competição" />
            <NavMain items={getNavItems(role ?? "USER")} label="Área restrita" />
            <NavMain items={supportNav[role ?? "USER"]} label="Atalhos" />
          </>
        ) : (
          <NavMain items={publicNav} label="Navegação" />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
