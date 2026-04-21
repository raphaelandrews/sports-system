import * as React from "react"
import { useRouterState } from "@tanstack/react-router"
import {
  ChevronsUpDown,
  Crown,
  Flag,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@sports-system/ui/components/sidebar"

import type { Session } from "@/types/auth"

type WorkspaceItem = {
  name: string
  meta: string
  icon: React.ElementType
  href: string
}

const roleMeta: Record<Session["role"], WorkspaceItem[]> = {
  ADMIN: [
    {
      name: "Central Admin",
      meta: "Operação geral",
      icon: Crown,
      href: "/dashboard",
    },
    {
      name: "Delegações",
      meta: "Gestão esportiva",
      icon: Sparkles,
      href: "/dashboard/delegations",
    },
  ],
  CHIEF: [
    {
      name: "Minha Delegação",
      meta: "Gestão esportiva",
      icon: Flag,
      href: "/dashboard",
    },
    {
      name: "Inscrições",
      meta: "Janela atual",
      icon: ShieldCheck,
      href: "/dashboard",
    },
  ],
  ATHLETE: [
    {
      name: "Agenda pessoal",
      meta: "Próximas partidas",
      icon: Trophy,
      href: "/dashboard",
    },
    {
      name: "Resultados",
      meta: "Histórico recente",
      icon: UserRound,
      href: "/results",
    },
  ],
  COACH: [
    {
      name: "Painel técnico",
      meta: "Acompanhamento",
      icon: ShieldCheck,
      href: "/dashboard",
    },
    {
      name: "Agenda da equipe",
      meta: "Próximos jogos",
      icon: Trophy,
      href: "/calendar",
    },
  ],
}

export function TeamSwitcher({ session }: { session: Session }) {
  const { isMobile } = useSidebar()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const workspaces = roleMeta[session.role]
  const activeWorkspace =
    workspaces.find(
      (workspace) =>
        pathname === workspace.href || pathname.startsWith(`${workspace.href}/`)
    ) ?? workspaces[0]

  if (!activeWorkspace) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <activeWorkspace.icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Sports System</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                {activeWorkspace.name}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Áreas rápidas
              </DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.name}
                  render={<a href={workspace.href} />}
                  className="gap-3 p-2"
                >
                  <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                    <workspace.icon className="size-4" />
                  </div>
                  <div className="grid leading-tight">
                    <span className="font-medium">{workspace.name}</span>
                    <span className="text-xs text-muted-foreground">{workspace.meta}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-3 p-2">
                <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid leading-tight">
                  <span className="font-medium">
                    {session.role === "ADMIN" ? "Modo controle" : "Modo competição"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {session.email}
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
