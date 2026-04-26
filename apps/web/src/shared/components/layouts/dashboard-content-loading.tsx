import { LoaderCircle } from "lucide-react";

export function DashboardContentLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoaderCircle size={20} className="text-muted-foreground" />
    </div>
  );
}

export function DashboardViewportLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <LoaderCircle size={20} className="text-muted-foreground" />
    </div>
  );
}
