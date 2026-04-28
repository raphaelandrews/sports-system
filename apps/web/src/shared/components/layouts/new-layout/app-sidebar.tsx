"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@sports-system/ui/components/sidebar"

import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  buildMembershipNav,
  buildPrimaryNav,
  buildWorkspaces,
  getLeagueIdFromPath,
  type ShellScope,
} from "@/shared/components/layouts/shell-navigation"
import { leagueListQueryOptions, myLeaguesQueryOptions } from "@/features/leagues/api/queries"
import type { Session } from "@/types/auth"
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  session: Session | null
  pathname: string
  scope: ShellScope
  league?: LeagueResponse
  membership?: LeagueMemberResponse
}

export function AppSidebar({
  session,
  pathname,
  scope,
  league,
  membership,
  ...props
}: AppSidebarProps) {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const leagueId = league ? String(league.id) : getLeagueIdFromPath(pathname)
  const platformRole = (session?.role as Session["role"] | undefined) ?? "USER"

  const leaguesQuery = useQuery(leagueListQueryOptions())
  const myLeaguesQuery = useQuery({
    ...myLeaguesQueryOptions(),
    enabled: Boolean(session),
  })

  const workspaceLeagues =
    session && myLeaguesQuery.data?.length ? myLeaguesQuery.data : (leaguesQuery.data ?? [])

  const workspaces = session
    ? buildWorkspaces({
        role: platformRole,
        leagues: workspaceLeagues,
        leagueId,
      })
    : []

  const membershipNav = buildMembershipNav({
    membershipRole: membership?.role,
    platformRole,
    leagueId,
  })

  const navItems = buildPrimaryNav({
    scope,
    leagueId,
    membershipRole: membership?.role,
    platformRole,
  })

  const navMain = navItems.map((item) => ({
    title: item.label,
    url: item.href,
    icon: item.icon,
    isActive: item.exact ? pathname === item.href : pathname.startsWith(item.href),
  }))

  const secondaryItems = [
    ...membershipNav.secondary.map((item) => ({
      title: item.label,
      url: item.href,
      icon: item.icon,
    })),
    ...membershipNav.support.map((item) => ({
      title: item.label,
      url: item.href,
      icon: item.icon,
    })),
  ]

  const navSecondary = [
    ...secondaryItems,
    {
      title: "Suporte",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ]

  return (
    <Sidebar
      collapsible="icon"
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          {!isCollapsed && (
            <span className="text-sm font-medium text-sidebar-foreground">Menu</span>
          )}
          <button
            onClick={toggleSidebar}
            className="flex size-6 items-center justify-center rounded border border-sidebar-border text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={isCollapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-3.5" />
            ) : (
              <PanelLeftClose className="size-3.5" />
            )}
          </button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={
            session
              ? {
                  name: session.name,
                  email: session.email,
                  avatar: "",
                }
              : {
                  name: "Visitante",
                  email: "",
                  avatar: "",
                }
          }
          session={session}
          workspaces={workspaces}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
