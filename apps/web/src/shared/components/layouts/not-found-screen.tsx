import { Link } from "@tanstack/react-router";
import { TrophyIcon } from "lucide-react";

import { Button } from "@sports-system/ui/components/button";

export function NotFoundScreen() {
  return (
    <main className="isolate flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl text-foreground">
          <TrophyIcon className="size-12" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium tabular-nums text-muted-foreground">404</p>
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground">
            Page not found
          </h1>
          <p className="text-pretty text-base text-muted-foreground sm:text-sm">
            Check the URL or head back to your dashboard.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <Button render={<Link to="/" />}>Go to dashboard</Button>
          <Button variant="ghost" render={<Link to="/login" search={{ redirect: "/" }} />}>
            Sign in
          </Button>
        </div>
      </div>
    </main>
  );
}
