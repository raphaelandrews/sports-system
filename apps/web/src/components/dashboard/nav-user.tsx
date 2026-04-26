import { ChevronsUpDown, LogIn, LogOut, ShieldCheck, Trophy, UserRoundPlus } from "lucide-react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
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
import { logoutFn } from "@/server/auth";
import type { Session } from "@/types/auth";

export function NavUser({ user }: { user: Session | null }) {
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton render={<Link to="/login" />} size="lg">
            <LogIn className="size-4" />
            <span>Entrar</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const { isMobile } = useSidebar();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const leagueId = pathname.match(/^\/leagues\/(\d+)/)?.[1];

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel: Record<Session["role"], string> = {
    SUPERADMIN: "Administrador",
    USER: "Usuário",
    ADMIN: "Administrador",
    CHIEF: "Chefe",
    COACH: "Técnico",
    ATHLETE: "Atleta",
  };

  async function handleLogout() {
    await logoutFn();
    await router.invalidate();
    router.navigate({ to: "/login" });
    toast.success("Sessão encerrada");
  }

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
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {roleLabel[user.role]}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem render={<Link to="/my-leagues" />}>
                <>
                  <Trophy />
                  Minhas ligas
                </>
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link to="/request-chief" />}>
                <>
                  <UserRoundPlus />
                  Solicitar chefe
                </>
              </DropdownMenuItem>
              {leagueId ? (
                <DropdownMenuItem render={<Link to="/leagues/$leagueId" params={{ leagueId }} />}>
                  <>
                    <ShieldCheck />
                    Liga atual
                  </>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem>
                <ShieldCheck />
                {roleLabel[user.role]}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
