import { Button } from "@sports-system/ui/components/button";
import { Field, FieldLabel } from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/features/auth/components/auth-card";
import { loginFn } from "@/features/auth/server/auth";

function syncAccessTokenCookie(accessToken: string) {
  document.cookie = `access_token=${accessToken}; path=/; max-age=1800; SameSite=Lax`;
}

export function LoginForm() {
  const router = useRouter();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const tokens = await loginFn({ data: value });
        syncAccessTokenCookie(tokens.access_token);
        await router.invalidate();
        await navigate({ to: "/leagues" });
      } catch (err) {
        if (err instanceof Error) {
          setServerError(err.message);
          toast.error(err.message);
        }
      }
    },
  });

  return (
    <AuthCard
      title="Bem-vindo de volta"
      subtitle="Acesse sua conta para continuar"
      switchText={
        <>
          Não tem conta?{" "}
          <a href="/register" className="underline underline-offset-4 hover:text-foreground">
            Cadastre-se
          </a>
        </>
      }
      onFormSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="email"
        validators={{
          onChange: ({ value }) => (!value.trim() ? "E-mail obrigatório" : undefined),
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="sports@email.com"
              autoComplete="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-destructive-foreground text-xs">{field.state.meta.errors[0]}</p>
            )}
          </Field>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => (!value ? "Senha obrigatória" : undefined),
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-destructive-foreground text-xs">{field.state.meta.errors[0]}</p>
            )}
          </Field>
        )}
      </form.Field>

      {serverError && <p className="text-destructive-foreground text-sm">{serverError}</p>}

      <Field>
        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          )}
        </form.Subscribe>
      </Field>
    </AuthCard>
  );
}
