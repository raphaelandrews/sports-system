import { Button } from "@sports-system/ui/components/button";
import { Field, FieldLabel } from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/auth/auth-card";
import { registerFn } from "@/server/auth";

function syncAccessTokenCookie(accessToken: string) {
  document.cookie = `access_token=${accessToken}; path=/; max-age=1800; SameSite=Lax`;
}

export function RegisterForm() {
  const router = useRouter();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        const tokens = await registerFn({
          data: { name: value.name, email: value.email, password: value.password },
        });
        syncAccessTokenCookie(tokens.access_token);
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
    <AuthCard
      title="Criar conta"
      subtitle="Preencha os dados para se cadastrar"
      switchText={
        <>
          Já tem conta?{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-foreground">
            Entrar
          </a>
        </>
      }
      onFormSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) =>
            !value.trim() ? "Nome obrigatório" : undefined,
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              autoComplete="name"
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
        name="email"
        validators={{
          onChange: ({ value }) => {
            if (!value.trim()) return "E-mail obrigatório";
            if (!value.includes("@")) return "E-mail inválido";
            return undefined;
          },
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
          onChange: ({ value }) => {
            if (value.length < 8 || !/[A-Z]/.test(value) || !/[^a-zA-Z0-9]/.test(value))
              return "invalid";
            return undefined;
          },
        }}
      >
        {(field) => {
          const v = field.state.value;
          const touched = field.state.meta.isTouched;
          const rules = [
            { label: "Mínimo 8 caracteres", ok: v.length >= 8 },
            { label: "Ao menos uma letra maiúscula", ok: /[A-Z]/.test(v) },
            { label: "Ao menos um símbolo", ok: /[^a-zA-Z0-9]/.test(v) },
          ];
          return (
            <Field>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={v}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              {(touched || v.length > 0) && (
                <ul className="mt-1 space-y-0.5">
                  {rules.map((r) => (
                    <li
                      key={r.label}
                      className={`flex items-center gap-1.5 text-xs ${r.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
                    >
                      <span>{r.ok ? "✓" : "•"}</span>
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </Field>
          );
        }}
      </form.Field>

      <form.Field
        name="confirmPassword"
        validators={{
          onChangeListenTo: ["password"],
          onChange: ({ value, fieldApi }) => {
            const password = fieldApi.form.getFieldValue("password");
            if (!value) return "Confirme a senha";
            if (value !== password) return "As senhas não coincidem";
            return undefined;
          },
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
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
              {isSubmitting ? "Cadastrando..." : "Criar conta"}
            </Button>
          )}
        </form.Subscribe>
      </Field>
    </AuthCard>
  );
}
