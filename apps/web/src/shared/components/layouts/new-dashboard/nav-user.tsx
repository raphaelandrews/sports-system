import { LogOutIcon, Sparkles, UserIcon, SettingsIcon, CreditCardIcon } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@sports-system/ui/components/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@sports-system/ui/components/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@sports-system/ui/components/sidebar";

import { logoutFn } from "@/features/auth/server/auth";
import type { Session } from "@/types/auth";

interface NavUserProps {
	user: {
		name: string;
		email: string;
		avatar: string;
	};
	session: Session | null;
}

export function NavUser({ user, session }: NavUserProps) {
	const { isMobile } = useSidebar();
	const router = useRouter();

	async function handleLogout() {
		await logoutFn();
		await router.invalidate();
		await router.navigate({ to: "/login" });
		toast.success("Sessão encerrada");
	}

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={user.avatar} alt={user.name} />
								<AvatarFallback className="rounded-lg">
									{user.name ? user.name.charAt(0) : "SS"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs">{user.email}</span>
							</div>
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<div className="flex items-center gap-2 px-3 py-2 text-left text-sm border-b mb-1">
							<Avatar className="h-8 w-8 rounded-lg">
								<AvatarImage src={user.avatar} alt={user.name} />
								<AvatarFallback className="rounded-lg">
									{user.name ? user.name.charAt(0) : "SS"}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs">{user.email}</span>
							</div>
						</div>
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={() => toast.info("Em breve")}>
								<UserIcon />
								Conta
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => toast.info("Em breve")}>
								<SettingsIcon />
								Configurações
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<div className="h-px bg-border my-1 mx-2" />
						<DropdownMenuGroup>
							<DropdownMenuItem onClick={() => toast.info("Em breve")}>
								<CreditCardIcon />
								Assinatura
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<div className="h-px bg-border my-1 mx-2" />
						<DropdownMenuGroup>
							{session ? (
								<DropdownMenuItem
									className="w-full cursor-pointer"
									variant="destructive"
									onClick={() => void handleLogout()}
								>
									<LogOutIcon />
									Sair
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem onClick={() => router.navigate({ to: "/login" })}>
									<Sparkles />
									Entrar
								</DropdownMenuItem>
							)}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
