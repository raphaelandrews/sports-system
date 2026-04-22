import * as React from "react"
import { useRouterState } from "@tanstack/react-router"
import { Skeleton } from "@sports-system/ui/components/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@sports-system/ui/components/breadcrumb"
import { Badge } from "@sports-system/ui/components/badge"
import { Separator } from "@sports-system/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@sports-system/ui/components/sidebar"
import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { GlobalSearchForm } from "@/components/dashboard/global-search-form"
import type { Session } from "@/types/auth"

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  )
}

function useBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const segments = pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean)

  const labels: Record<string, string> = {
    weeks: "Semanas",
    calendar: "Calendário",
    delegations: "Delegações",
    athletes: "Atletas",
    enrollments: "Inscrições",
    results: "Resultados",
    requests: "Solicitações",
    search: "Busca",
    ai: "Geração IA",
    reports: "Relatórios",
    events: "Eventos",
    new: "Novo",
    matches: "Partidas",
    "my-delegation": "Minha Delegação",
    members: "Membros",
    invite: "Convidar",
    transfers: "Transferências",
    "my-matches": "Minhas Partidas",
    "my-profile": "Meu Perfil",
  }

  return segments.map((s) => labels[s] ?? s)
}

export function DashboardLayout({
  session,
  children,
}: {
  session: Session
  children?: React.ReactNode
}) {
  const crumbs = useBreadcrumbs()
  const roleLabel: Record<Session["role"], string> = {
    ADMIN: "Administrador",
    CHIEF: "Chefe",
    ATHLETE: "Atleta",
    COACH: "Técnico",
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" session={session} />
      <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between gap-3 px-4">
            <div className="flex min-w-0 items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4 data-vertical:self-center"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/dashboard">Sports System</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{crumbs.at(-1) ?? "Dashboard"}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="hidden lg:block">
                <GlobalSearchForm />
              </div>
              <Badge variant="outline" className="hidden sm:inline-flex">
                {roleLabel[session.role]}
              </Badge>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <React.Suspense fallback={<ContentSkeleton />}>
            {children}
          </React.Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
