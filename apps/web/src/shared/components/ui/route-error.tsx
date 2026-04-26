import { Button } from "@sports-system/ui/components/button";
import { useRouter } from "@tanstack/react-router";

import { ApiError } from "@/shared/lib/api";

interface RouteErrorComponentProps {
  error: unknown;
  reset?: () => void;
}

export function RouteErrorComponent({ error, reset }: RouteErrorComponentProps) {
  const router = useRouter();

  const isApiError = error instanceof ApiError;
  const status = isApiError ? error.status : null;
  const message = error instanceof Error ? error.message : "Erro desconhecido";

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="grid gap-1">
        {status && <p className="text-muted-foreground text-xs font-mono">{status}</p>}
        <p className="text-sm font-medium">{message}</p>
      </div>
      {reset && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            reset();
            router.invalidate();
          }}
        >
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
