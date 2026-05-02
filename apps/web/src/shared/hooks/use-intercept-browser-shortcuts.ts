import { useEffect } from "react";
import { toast } from "sonner";

const BLOCKED_SHORTCUTS: Array<{
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	message: string;
}> = [
	{ key: "s", ctrl: true, message: "Ctrl+S desativado — use os atalhos do app" },
	{ key: "p", ctrl: true, message: "Ctrl+P desativado — use Ctrl+Shift+X para navegar" },
	{ key: "f", ctrl: true, message: "Ctrl+F desativado — use Ctrl+Shift+X para buscar" },
	{ key: "h", ctrl: true, message: "Ctrl+H desativado — histórico bloqueado" },
	{ key: "j", ctrl: true, message: "Ctrl+J desativado — downloads bloqueados" },
	{ key: "l", ctrl: true, message: "Ctrl+L desativado — barra de endereço bloqueada" },
	{ key: "t", ctrl: true, message: "Ctrl+T desativado — nova aba bloqueada" },
	{ key: "w", ctrl: true, message: "Ctrl+W desativado — feche a aba pelo navegador" },
	{ key: "u", ctrl: true, message: "Ctrl+U desativado — código fonte bloqueado" },
	{ key: "r", ctrl: true, message: "Ctrl+R desativado — recarregamento bloqueado" },
	{ key: "r", ctrl: true, shift: true, message: "Ctrl+Shift+R desativado — recarregamento bloqueado" },
	{ key: "ArrowLeft", alt: true, message: "Alt+← desativado — navegação bloqueada" },
	{ key: "ArrowRight", alt: true, message: "Alt+→ desativado — navegação bloqueada" },
];

export function useInterceptBrowserShortcuts(enabled = true) {
	useEffect(() => {
		if (!enabled) return;

		const handler = (e: KeyboardEvent) => {
			// Always allow these even in TUI mode (escape hatch)
			if (e.key === "F5" && e.ctrlKey) return; // Ctrl+F5 hard reload
			if (e.key === "F12" && e.ctrlKey && e.shiftKey) return; // Ctrl+Shift+F12

			// Check blocked combinations
			for (const shortcut of BLOCKED_SHORTCUTS) {
				const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
				const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
				const altMatch = shortcut.alt ? e.altKey : !e.altKey;

				if (
					e.key.toLowerCase() === shortcut.key.toLowerCase() &&
					ctrlMatch &&
					shiftMatch &&
					altMatch
				) {
					e.preventDefault();
					toast.info(shortcut.message, {
						duration: 2000,
					});
					return;
				}
			}
		};

		document.addEventListener("keydown", handler, { capture: true });
		return () => document.removeEventListener("keydown", handler, { capture: true });
	}, [enabled]);
}
