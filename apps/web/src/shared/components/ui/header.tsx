import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@sports-system/ui/components/button";
import { useNavCommand } from "@/shared/components/layouts/nav-command-context";
import type { Session } from "@/types/auth";
import { CommandIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { LoginDialog } from "./login-dialog";
import { NavUser } from "@/shared/components/ui/nav-user";

interface HeaderProps {
  session: Session | null;
}

export function Header({ session }: HeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { open: openNav } = useNavCommand();
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openNav();
        return;
      }

      if (isMod && e.shiftKey && e.key.toLowerCase() === "l" && !session) {
        e.preventDefault();
        setLoginOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openNav, session]);

  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl! container flex h-14 items-center">
        {pathname === "/" ? (
          <div className="mr-4 flex items-center space-x-2 font-black lg:mr-6">
            <h1>SportsHub</h1>
          </div>
        ) : (
          <Link to={"/"} className="mr-4 flex items-center space-x-2 font-black lg:mr-6">
            <h1>SportsHub</h1>
          </Link>
        )}
        <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
          {session ? (
            <NavUser session={session} />
          ) : (
            <Button
              variant="surface4"
              size="sm"
              onClick={() => setLoginOpen(true)}
            >
              Entrar
            </Button>
          )}
          <Button
            variant="surface4"
            size="sm"
            onClick={openNav}
          >
            <CommandIcon className="size-4" />
          </Button>
        </div>
      </div>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}

