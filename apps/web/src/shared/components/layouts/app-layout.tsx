import type { ReactNode } from "react";

import { Footer } from "@/shared/components/ui/footer";
import { Header } from "@/shared/components/ui/header";
import type { Session } from "@/types/auth";

export function AppLayout({
  children,
  session,
}: {
  children: ReactNode;
  session: Session | null;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <Header session={session} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
