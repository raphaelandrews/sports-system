import { Button } from "@sports-system/ui/components/button";
import { Field, FieldLabel } from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import * as m from "@/paraglide/messages";
import { AuthCard } from "@/features/auth/components/auth-card";
import { registerFn } from "@/features/auth/server/auth";

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
      title={m['register_title']()}
      subtitle={m['auth.register.subtitle']()}
      switchText={
        <>
          {m['auth.register.hasAccount']()}{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-foreground">
            {m['auth.register.loginLink']()}
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
          onChange: ({ value }) => (!value.trim() ? m['auth.register.nameRequired']() : undefined),
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor="name">{m['register_name']()}</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder={m['auth.register.namePlaceholder']()}
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
            if (!value.trim()) return m['auth.register.emailRequired']();
            if (!value.includes("@")) return m['auth.register.emailInvalid']();
            return undefined;
          },
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor="email">{m['login_email']()}</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={m['auth.register.emailPlaceholder']()}
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
              return m['auth.register.passwordInvalid']();
            return undefined;
          },
        }}
      >
        {(field) => {
          const v = field.state.value;
          const touched = field.state.meta.isTouched;
          const rules = [
            { label: m['auth.register.ruleMin8'](), ok: v.length >= 8 },
            { label: m['auth.register.ruleUppercase'](), ok: /[A-Z]/.test(v) },
            { label: m['auth.register.ruleSymbol'](), ok: /[^a-zA-Z0-9]/.test(v) },
          ];
          return (
            <Field>
              <FieldLabel htmlFor="password">{m['auth.register.passwordLabel']()}</FieldLabel>
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
            if (!value) return m['auth.register.confirmPasswordRequired']();
            if (value !== password) return m['auth.register.passwordMismatch']();
            return undefined;
          },
        }}
      >
        {(field) => (
          <Field>
            <FieldLabel htmlFor="confirmPassword">{m['auth.register.confirmPasswordLabel']()}</FieldLabel>
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
              {isSubmitting ? m['auth.register.submitting']() : m['register_submit']()}
            </Button>
          )}
        </form.Subscribe>
      </Field>
    </AuthCard>
  );
}
