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

import { registerFn } from "@/server/auth";

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    if (context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const router = useRouter();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      setServerError(null);
      if (value.password !== value.confirmPassword) {
        setServerError("As senhas não coincidem.");
        return;
      }
      try {
        await registerFn({
          data: { name: value.name, email: value.email, password: value.password },
        });
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
          <h1 className="text-2xl font-semibold">Criar conta</h1>
          <p className="text-muted-foreground text-sm">
            Preencha os dados para se cadastrar.
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
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value.trim() ? "Nome obrigatório" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
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
                value.length < 8 ? "Mínimo 8 caracteres" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
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
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
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
                {isSubmitting ? "Cadastrando..." : "Criar conta"}
              </Button>
            )}
          </form.Subscribe>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          Já tem conta?{" "}
          <Link to="/login" className="text-foreground underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
