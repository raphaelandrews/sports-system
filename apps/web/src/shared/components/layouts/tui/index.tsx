import * as React from "react";
import { DashboardContentLoading } from "@/shared/components/layouts/dashboard-content-loading";
import { NavCommandProvider } from "@/shared/components/layouts/nav-command";
import { useInterceptBrowserShortcuts } from "@/shared/hooks/use-intercept-browser-shortcuts";
import type { Session } from "@/types/auth";
import { Header } from "@/shared/components/ui/header";

interface TUIProps {
	session: Session | null;
	children?: React.ReactNode;
}

export function TUI({ session, children }: TUIProps) {
	useInterceptBrowserShortcuts(true);

  return (
    <NavCommandProvider session={session} scope="site-public" league={undefined} membership={undefined}>
      <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
        <Header session={session} />
        <main className="flex-1 overflow-y-auto">
          <React.Suspense fallback={<DashboardContentLoading />}>
            {children}
          </React.Suspense>
        </main>
      </div>
    </NavCommandProvider>
  );
}
