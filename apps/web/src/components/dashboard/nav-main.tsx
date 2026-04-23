import { ChevronRight, type LucideIcon } from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useState } from "react"
import { cn } from "@/lib/utils"
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
            <ExpandableNavItem
              key={item.title}
              item={item as NavItem & { items: { title: string; url: string }[] }}
              pathname={pathname}
            />
          ) : (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link to={item.url} />}
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

function ExpandableNavItem({
  item,
  pathname,
}: {
  item: NavItem & { items: { title: string; url: string }[] }
  pathname: string
}) {
  const isActive =
    pathname === item.url ||
    item.items.some(
      (subItem) => pathname === subItem.url || pathname.startsWith(`${subItem.url}/`)
    )
  const [open, setOpen] = useState(isActive || item.isActive)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={item.title}
        isActive={isActive}
        onClick={() => setOpen((current) => !current)}
      >
        {item.icon && <item.icon />}
        <span>{item.title}</span>
        <ChevronRight
          className={cn("ml-auto transition-transform duration-200", open && "rotate-90")}
        />
      </SidebarMenuButton>
      {open ? (
        <SidebarMenuSub>
          {item.items.map((subItem) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton
                render={<Link to={subItem.url} />}
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
      ) : null}
    </SidebarMenuItem>
  )
}
