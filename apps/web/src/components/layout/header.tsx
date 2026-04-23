import { Button } from "@sports-system/ui/components/button";
import { Badge } from "@sports-system/ui/components/badge";
import { Link, useRouter, useRouteContext } from "@tanstack/react-router";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { NotificationBell } from "@/components/ui/notification-bell";
import { logoutFn } from "@/server/auth";
import { isTransferWindow } from "@/lib/date";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/weeks", label: "Semanas" },
  { to: "/results", label: "Resultados" },
  { to: "/feed", label: "Feed" },
  { to: "/calendar", label: "Calendário" },
  { to: "/delegations", label: "Delegações" },
  { to: "/sports", label: "Esportes" },
] as const;

export default function Header() {
  const router = useRouter();
  const { session } = useRouteContext({ from: "__root__" });

  async function handleLogout() {
    try {
      await logoutFn();
    } finally {
      await router.navigate({ to: "/" });
      await router.invalidate();
    }
  }

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <nav className="flex gap-4 text-sm">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {label}
            </Link>
          ))}
          {session && (
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session && isTransferWindow() && (
            <Badge variant="secondary" className="text-xs hidden sm:flex">
              Janela de transferências
            </Badge>
          )}
          {session ? (
            <>
              <NotificationBell userId={session.id} />
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session.name}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleLogout()}
              >
                Sair
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                Entrar
              </Button>
            </Link>
          )}
          <AnimatedThemeToggler />
        </div>
      </div>
      <hr />
    </div>
  );
}