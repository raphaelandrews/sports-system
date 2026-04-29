import { AlertCircleIcon, LockIcon, RefreshCwIcon, SearchIcon, WifiOffIcon } from "lucide-react";
import { Button } from "@sports-system/ui/components/button";
import { cn } from "@sports-system/ui/lib/utils";
import { type ErrorComponentProps, Link, useRouter } from "@tanstack/react-router";
import { type ComponentType } from "react";

type ErrorInfo = {
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  iconClassName: string;
  title: string;
  description: string;
  action: "retry" | "sign-in" | "go-home";
};

function getErrorInfo(error: Error): ErrorInfo {
  const msg = error.message;
  const lower = msg.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("429")) {
    return {
      icon: AlertCircleIcon,
      iconClassName: "bg-amber-500/10 text-amber-500",
      title: "Rate limit reached",
      description: "You've made too many requests. Wait a moment and try again.",
      action: "retry",
    };
  }

  if (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("bad credentials") ||
    lower.includes("token")
  ) {
    return {
      icon: LockIcon,
      iconClassName: "bg-amber-500/10 text-amber-500",
      title: "Authentication required",
      description: "Your session is missing or expired. Sign in again to continue.",
      action: "sign-in",
    };
  }

  if (
    lower.includes("403") ||
    lower.includes("forbidden") ||
    lower.includes("insufficient permissions")
  ) {
    return {
      icon: LockIcon,
      iconClassName: "bg-amber-500/10 text-amber-500",
      title: "Access not available",
      description: "This area is not available for your current access level.",
      action: "go-home",
    };
  }

  if (lower.includes("404") || lower.includes("not found")) {
    return {
      icon: SearchIcon,
      iconClassName: "bg-muted-foreground/10 text-muted-foreground",
      title: "Not found",
      description: "This resource doesn't exist or you don't have access to it.",
      action: "go-home",
    };
  }

  if (
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("failed to fetch")
  ) {
    return {
      icon: WifiOffIcon,
      iconClassName: "bg-amber-500/10 text-amber-500",
      title: "Connection failed",
      description: "Could not reach the server. Check your connection and try again.",
      action: "retry",
    };
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return {
      icon: AlertCircleIcon,
      iconClassName: "bg-amber-500/10 text-amber-500",
      title: "Request timed out",
      description: "The request took too long to complete. Try again in a moment.",
      action: "retry",
    };
  }

  return {
    icon: AlertCircleIcon,
    iconClassName: "bg-destructive/10 text-destructive",
    title: "Something went wrong",
    description: msg || "An unexpected error occurred. Please try again or refresh the page.",
    action: "retry",
  };
}

function cleanErrorMessage(msg: string): string | null {
  if (!msg) return null;
  const cleaned = msg
    .replace(/\s*-\s+(GET|POST|PUT|PATCH|DELETE|HEAD)\s+https?:\/\/\S+$/i, "")
    .trim();
  return cleaned || null;
}

export function ErrorScreen({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const { icon: Icon, iconClassName, title, description, action } = getErrorInfo(error);
  const isNotFound = action === "go-home";
  const detail = isNotFound ? null : cleanErrorMessage(error.message);

  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
        {isNotFound ? (
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <SearchIcon size={24} strokeWidth={1.75} />
          </div>
        ) : (
          <div className={cn("flex size-12 items-center justify-center rounded-xl", iconClassName)}>
            <Icon size={24} strokeWidth={1.75} />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-balance text-sm text-muted-foreground">{description}</p>
        </div>

        {detail && (
          <p className="max-w-sm rounded-lg bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {detail}
          </p>
        )}

        <div className="flex items-center gap-2">
          {action === "sign-in" ? (
            <Button size="sm" render={<Link to="/login" />}>
              Sign in
            </Button>
          ) : null}
          {action === "go-home" ? (
            <Button variant="ghost" size="sm" render={<Link to="/" />}>
              Go home
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                router.invalidate();
              }}
            >
              <RefreshCwIcon />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
