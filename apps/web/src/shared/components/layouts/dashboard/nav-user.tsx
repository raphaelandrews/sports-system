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

import { logoutFn } from "@/features/auth/server/auth";
import type { Session } from "@/types/auth";

interface NavUserProps {
	session: Session | null;
}

export function NavUser({ session }: NavUserProps) {
	const router = useRouter();
	const user = session
		? { name: session.name, email: session.email, avatar: session.avatar_url ?? "" }
		: { name: "Visitante", email: "", avatar: "" };

	async function handleLogout() {
		await logoutFn();
		await router.invalidate();
		await router.navigate({ to: "/login" });
		toast.success("Sessão encerrada");
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="flex h-10 items-center gap-2 rounded-md px-2 hover:text-accent-foreground outline-none">
				<Avatar className="h-8 w-8 rounded-md after:border-none">
					<AvatarImage src={user.avatar} alt={user.name} />
					<AvatarFallback className="font-semibold text-xs rounded-md">
						{user.name ? user.name.charAt(0) : "SH"}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-56 rounded-lg"
				side="bottom"
				align="end"
				sideOffset={4}
			>
				<div className="flex items-center gap-2 px-3 py-2 text-left text-sm border-b mb-1">
					<Avatar className="h-8 w-8 rounded-md after:border-none">
						<AvatarImage src={user.avatar} alt={user.name} />
						<AvatarFallback className="font-semibold text-xs rounded-md bg-accent">
							{user.name ? user.name.charAt(0) : "SH"}
						</AvatarFallback>
					</Avatar>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-medium">{user.name}</span>
						<span className="truncate text-xs">{user.email}</span>
					</div>
				</div>
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => router.navigate({ to: "/profile" })}>
						<UserIcon />
						Conta
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
	);
}
