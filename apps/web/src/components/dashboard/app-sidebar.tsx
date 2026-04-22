import * as React from "react"
import {
  BarChart3,
  CalendarDays,
  ChartColumn,
  Flag,
  Home,
  Medal,
  Shield,
  Settings,
  Sparkles,
  Trophy,
  Users,
  UserCheck,
  ClipboardList,
} from "lucide-react"

import { NavMain, type NavItem } from "@/components/dashboard/nav-main"
import { NavUser } from "@/components/dashboard/nav-user"
import { TeamSwitcher } from "@/components/dashboard/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@sports-system/ui/components/sidebar"
import type { Session } from "@/types/auth"

const commonNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Calendário", url: "/calendar", icon: CalendarDays },
  { title: "Resultados", url: "/results", icon: Medal },
  { title: "Delegações", url: "/delegations", icon: Flag },
  { title: "Esportes", url: "/sports", icon: Trophy },
]

const adminNav: NavItem[] = [
  {
    title: "Administração",
    url: "#",
    icon: Settings,
    isActive: false,
    items: [
      { title: "Semanas", url: "/dashboard/weeks" },
      { title: "Delegações", url: "/dashboard/delegations" },
      { title: "Esportes", url: "/dashboard/sports" },
      { title: "Atletas", url: "/dashboard/athletes" },
      { title: "Inscrições", url: "/dashboard/enrollments" },
      { title: "Resultados", url: "/dashboard/results" },
      { title: "Solicitações", url: "/dashboard/requests" },
    ],
  },
  { title: "Geração IA", url: "/dashboard/ai", icon: Sparkles },
  { title: "Relatórios", url: "/dashboard/reports", icon: BarChart3 },
]

const chiefNav: NavItem[] = [
  {
    title: "Minha Delegação",
    url: "#",
    icon: Flag,
    isActive: false,
    items: [
      { title: "Visão geral", url: "/dashboard/my-delegation" },
      { title: "Membros", url: "/dashboard/my-delegation/members" },
      { title: "Convidar", url: "/dashboard/my-delegation/invite" },
      { title: "Transferências", url: "/dashboard/my-delegation/transfers" },
    ],
  },
  { title: "Inscrições", url: "/dashboard/enrollments", icon: ClipboardList },
  { title: "Atletas", url: "/dashboard/athletes", icon: Users },
]

const athleteNav: NavItem[] = [
  { title: "Minhas partidas", url: "/dashboard/my-matches", icon: CalendarDays },
  { title: "Meu perfil atleta", url: "/dashboard/my-profile", icon: UserCheck },
]

const supportNav: Record<Session["role"], NavItem[]> = {
  ADMIN: [
    { title: "Centro analítico", url: "/dashboard/reports", icon: ChartColumn },
    { title: "Automação IA", url: "/dashboard/ai", icon: Sparkles },
  ],
  CHIEF: [
    { title: "Resultados da delegação", url: "/results", icon: Trophy },
    { title: "Área protegida", url: "/dashboard", icon: Shield },
  ],
  ATHLETE: [
    { title: "Calendário oficial", url: "/calendar", icon: CalendarDays },
    { title: "Meu painel", url: "/dashboard", icon: Shield },
  ],
  COACH: [
    { title: "Agenda da equipe", url: "/calendar", icon: CalendarDays },
    { title: "Área protegida", url: "/dashboard", icon: Shield },
  ],
}

function getNavItems(role: Session["role"]): NavItem[] {
  if (role === "ADMIN") return adminNav
  if (role === "CHIEF") return chiefNav
  return athleteNav
}

export function AppSidebar({
  session,
  ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session }) {
  const roleNav = getNavItems(session.role)
  const quickNav = supportNav[session.role]

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <TeamSwitcher session={session} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={commonNav} label="Competição" />
        <NavMain items={roleNav} label="Área restrita" />
        <NavMain items={quickNav} label="Atalhos" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={session} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
