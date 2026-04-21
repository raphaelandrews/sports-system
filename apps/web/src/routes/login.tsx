import { Button } from "@sports-system/ui/components/button";
import { Input } from "@sports-system/ui/components/input";
import { Label } from "@sports-system/ui/components/label";
import { useForm } from "@tanstack/react-form";
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { loginFn } from "@/server/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await loginFn({ data: value });
        await router.invalidate();
        await navigate({ to: "/dashboard" });
      } catch (err) {
        if (err instanceof Error) {
          setServerError(err.message);
          toast.error(err.message);
        }
      }
    },
  });

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Entrar</h1>
          <p className="text-muted-foreground text-sm">
            Acesse sua conta para continuar.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "E-mail obrigatório" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                !value ? "Senha obrigatória" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {serverError && (
            <p className="text-destructive text-sm">{serverError}</p>
          )}

          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Não tem conta?{" "}
          <Link to="/register" className="text-foreground underline-offset-4 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
