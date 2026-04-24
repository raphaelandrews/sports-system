import { Button } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { finalizeOAuthFn } from "@/server/auth";

const callbackSearchSchema = z.object({
  token: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/auth/oauth/callback")({
  validateSearch: callbackSearchSchema,
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/leagues" });
    }
  },
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const search = Route.useSearch();
  const [error, setError] = useState<string | null>(search.error ?? null);
  const [isLoading, setIsLoading] = useState(Boolean(search.token) && !search.error);

  useEffect(() => {
    if (!search.token || search.error) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await finalizeOAuthFn({ data: { token: search.token! } });
        if (cancelled) return;
        await router.invalidate();
        await navigate({ to: "/leagues" });
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "OAuth login failed");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, router, search.error, search.token]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isLoading
              ? "Finalizando login OAuth"
              : error
                ? "Falha no login OAuth"
                : "Login concluído"}
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Validando a autenticação com o provedor externo."
              : error
                ? "Nao foi possivel concluir a autenticacao externa."
                : "Redirecionando para o dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Processando credenciais do Google ou GitHub.
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!isLoading ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate({ to: "/login" })}>
                Ir para login
              </Button>
              <Button onClick={() => navigate({ to: "/register" })}>Ir para cadastro</Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
