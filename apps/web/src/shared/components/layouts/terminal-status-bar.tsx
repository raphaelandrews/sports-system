import { useMemo, useState } from "react";
import { AlertCircleIcon, XIcon } from "lucide-react";

import { cn } from "@sports-system/ui/lib/utils";
import { roleLabel, type ShellScope } from "@/shared/components/layouts/shell-navigation";
import type { Session } from "@/types/auth";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";

type BarItem = {
	id: string;
	message: string;
	severity: "neutral" | "warning" | "error";
	dismissible?: boolean;
};

export function TerminalStatusBar({
	scope,
	session,
	league,
	membership,
	membershipError,
}: {
	scope: ShellScope;
	session: Session | null;
	league?: LeagueResponse;
	membership?: LeagueMemberResponse;
	membershipError: boolean;
}) {
	const [dismissedIds, setDismissedIds] = useState<string[]>([]);

	const items = useMemo<BarItem[]>(() => {
		const nextItems: BarItem[] = [];

		if (league) {
			nextItems.push({
				id: "league-context",
				severity: "neutral",
				message: membership
					? `${roleLabel(membership.role)} em ${league.name} · ${league.timezone}`
					: `${league.name} · ${league.timezone}`,
			});
		} else if (session) {
			nextItems.push({
				id: "platform-context",
				severity: "neutral",
				message: `${roleLabel(session.role)} conectado · plataforma ativa`,
			});
		}

		if (!session && scope !== "site-public") {
			nextItems.push({
				id: "auth-required",
				severity: "warning",
				message: "Entre para acessar ações privadas e navegar pela sua área.",
			});
		}

		if (membershipError && league) {
			nextItems.push({
				id: "membership-error",
				severity: "error",
				message: "Contexto autenticado da liga indisponível. Navegação pública mantida.",
				dismissible: true,
			});
		}

		if (scope === "site-authenticated") {
			nextItems.push({
				id: "create-league",
				severity: "warning",
				message: "Crie uma liga nova ou entre em uma existente para liberar o modo competição.",
				dismissible: true,
			});
		}

		return nextItems;
	}, [league, membership, membershipError, scope, session]);

	const visibleItems = items.filter((item) => !dismissedIds.includes(item.id));

	if (visibleItems.length === 0) {
		return (
			<div className="h-6 border-t bg-card flex items-center px-3 text-[10px] text-muted-foreground">
				<span className="text-border mr-2">~</span>
				ready
			</div>
		);
	}

	return (
		<div className="border-t bg-card flex items-center gap-3 px-3 py-1 text-[10px]">
			{visibleItems.map((item) => {
				const isError = item.severity === "error";
				const isWarning = item.severity === "warning";

				return (
					<div
						key={item.id}
						className={cn(
							"flex items-center gap-1.5",
							isError && "text-red-400",
							isWarning && "text-yellow-400",
							!isError && !isWarning && "text-muted-foreground",
						)}
					>
						<AlertCircleIcon size={10} strokeWidth={2} className="shrink-0" />
						<span className="truncate">{item.message}</span>
						{item.dismissible && (
							<button
								type="button"
								onClick={() => setDismissedIds((current) => [...current, item.id])}
								className="flex size-3.5 shrink-0 items-center justify-center hover:text-foreground transition-colors"
							>
								<XIcon size={10} strokeWidth={2} />
							</button>
						)}
					</div>
				);
			})}
		</div>
	);
}
