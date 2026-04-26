import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { ChevronsUpDown, Compass, Crown, Shield, Sparkles, Trophy } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@sports-system/ui/components/sidebar";

import { leagueListQueryOptions, myLeagueMembershipQueryOptions, myLeaguesQueryOptions } from "@/queries/leagues";
import type { Session } from "@/types/auth";
import type { LeagueResponse } from "@/types/leagues";

type WorkspaceItem = {
  name: string;
  meta: string;
  icon: React.ElementType;
  href: string;
};

type PlatformRole = Session["role"] | "SUPERADMIN" | "USER";

function buildWorkspaces(
  role: PlatformRole,
  leagues: LeagueResponse[],
  leagueId?: string,
): WorkspaceItem[] {
  const currentLeague = leagues.find((league) => String(league.id) === leagueId);

  if (currentLeague) {
    return [
      {
        name: currentLeague.name,
        meta: currentLeague.is_showcase ? "Showcase" : currentLeague.timezone,
        icon: currentLeague.is_showcase ? Crown : Trophy,
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
    return [{ name: "Central Admin", meta: "Operação geral", icon: Crown, href: "/" }, ...base];
  }

  return [{ name: "Painel pessoal", meta: "Visão geral", icon: Sparkles, href: "/" }, ...base];
}

export function TeamSwitcher({ session, leagueId }: { session: Session | null; leagueId?: string }) {
  const { isMobile } = useSidebar();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const leaguesQuery = useQuery(leagueListQueryOptions());
  const myLeaguesQuery = useQuery({
    ...myLeaguesQueryOptions(),
    enabled: Boolean(session),
  });
  const membershipQuery = useQuery({
    ...myLeagueMembershipQueryOptions(leagueId ?? "0"),
    enabled: Boolean(session && leagueId),
    retry: false,
  });

  if (!session) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Trophy className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Sports System</span>
              <span className="truncate text-xs text-sidebar-foreground/70">
                Competição esportiva
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const role = session.role as PlatformRole;
  const leagues = myLeaguesQuery.data?.length ? myLeaguesQuery.data : leaguesQuery.data ?? [];
  const workspaces = buildWorkspaces(role, leagues, leagueId);
  const activeWorkspace =
    workspaces.find(
      (workspace: WorkspaceItem) => pathname === workspace.href || pathname.startsWith(`${workspace.href}/`),
    ) ?? workspaces[0];

  if (!activeWorkspace) return null;

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
                {membershipQuery.data?.role
                  ? `${activeWorkspace.name} · ${membershipQuery.data.role}`
                  : activeWorkspace.name}
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
              {workspaces.map((workspace: WorkspaceItem) => (
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
              <DropdownMenuItem className="gap-3 p-2" render={<a href="/leagues/new" />}>
                <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid leading-tight">
                  <span className="font-medium">Criar nova liga</span>
                  <span className="text-xs text-muted-foreground">Abrir configuração inicial</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 p-2">
                <div className="flex size-7 items-center justify-center rounded-md border bg-background">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid leading-tight">
                  <span className="font-medium">
                    {role === "SUPERADMIN" ? "Modo controle" : "Modo competição"}
                  </span>
                  <span className="text-xs text-muted-foreground">{session.email}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
