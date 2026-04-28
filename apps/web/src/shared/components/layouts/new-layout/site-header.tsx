"use client"

import { SearchCommand } from "@/shared/components/layouts/search-command"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@sports-system/ui/components/breadcrumb"
import { AnimatedThemeToggler } from "@/shared/components/ui/animated-theme-toggler"
import type { Session } from "@/types/auth"
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues"
import type { ShellScope } from "@/shared/components/layouts/shell-navigation"

interface SiteHeaderProps {
  session: Session | null
  pathname: string
  scope: ShellScope
  league?: LeagueResponse
  membership?: LeagueMemberResponse
}

export function SiteHeader({ session, scope, league, membership }: SiteHeaderProps) {
  const leagueId = league ? String(league.id) : undefined

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Sports System</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {league ? league.name : scope === "site-authenticated" ? "Plataforma" : "Início"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <SearchCommand
            leagueId={leagueId}
            session={session}
            membershipRole={membership?.role}
            leagues={[]}
          />
          <AnimatedThemeToggler
            variant="outline"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-muted"
          />
        </div>
      </div>
    </header>
  )
}
