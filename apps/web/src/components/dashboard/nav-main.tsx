import { ChevronRight, type LucideIcon } from "lucide-react"
import { useRouterState } from "@tanstack/react-router"
import { cn } from "@/lib/utils"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sports-system/ui/components/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@sports-system/ui/components/sidebar"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: { title: string; url: string }[]
}

export function NavMain({ items, label }: { items: NavItem[]; label?: string }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={
                item.isActive ||
                item.items.some((subItem) => pathname === subItem.url || pathname.startsWith(`${subItem.url}/`))
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    className={cn(
                      (pathname === item.url || item.items.some((subItem) => pathname === subItem.url || pathname.startsWith(`${subItem.url}/`))) &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          render={<a href={subItem.url} />}
                          className={cn(
                            (pathname === subItem.url || pathname.startsWith(`${subItem.url}/`)) &&
                              "bg-sidebar-accent/70 text-sidebar-accent-foreground"
                          )}
                        >
                          <span>{subItem.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<a href={item.url} />}
                tooltip={item.title}
                className={cn(
                  (pathname === item.url || pathname.startsWith(`${item.url}/`)) &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
