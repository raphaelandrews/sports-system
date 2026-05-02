import { Alert, AlertDescription, AlertTitle } from "@sports-system/ui/components/alert";
import { Button } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import type { DelegationCreateInput, DelegationUpdateInput } from "@/types/delegations";

type DelegationFormValues = {
  name: string;
  code: string;
  flag_url: string;
};

interface AdminDelegationFormProps {
  mode: "create" | "edit";
  leagueId: number;
  defaultValues?: Partial<DelegationFormValues>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (value: DelegationCreateInput | DelegationUpdateInput) => Promise<void>;
}

export function AdminDelegationForm({
  mode,
  leagueId,
  defaultValues,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: AdminDelegationFormProps) {
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      flag_url: defaultValues?.flag_url ?? "",
    },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name.trim(),
        ...(mode === "create" && value.code.trim()
          ? { code: value.code.trim().toUpperCase() }
          : {}),
        ...(value.flag_url.trim() ? { flag_url: value.flag_url.trim() } : {}),
      };

      await onSubmit(payload);
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card className="border border-border/70 bg-linear-to-br from-card via-card to-muted/20">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Nova delegação" : "Editar delegação"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Cadastre delegações com identidade clara para o calendário, inscrições e relatórios."
              : "Atualize o nome público e a bandeira sem perder o histórico competitivo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="name"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length < 3
                      ? { message: "Informe um nome com pelo menos 3 caracteres." }
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="delegation-name">Nome</FieldLabel>
                    <Input
                      id="delegation-name"
                      placeholder="Ex: Delegação Bahia Atlética"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      Nome visível em listagens, quadro de medalhas e páginas públicas.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              {mode === "create" ? (
                <form.Field
                  name="code"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() && value.trim().length < 2
                      ? { message: "Use pelo menos 2 caracteres ou deixe em branco." }
                      : undefined,
                }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="delegation-code">Código</FieldLabel>
                      <Input
                        id="delegation-code"
                        placeholder="Ex: BAH"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      <FieldDescription>
                        Opcional. Se vazio, o backend pode gerar um código automaticamente.
                      </FieldDescription>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              ) : (
                <Alert>
                  <Sparkles className="size-4" />
                  <AlertTitle>Código preservado</AlertTitle>
                  <AlertDescription>
                    O código da delegação permanece estável para não quebrar referências históricas.
                  </AlertDescription>
                </Alert>
              )}

              <form.Field
                name="flag_url"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() && !/^https?:\/\/.+/i.test(value.trim())
                      ? { message: "Use uma URL iniciando com http:// ou https://." }
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="delegation-flag-url">URL da bandeira</FieldLabel>
                    <Input
                      id="delegation-flag-url"
                      placeholder="https://..."
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      Opcional. Use um link estável para renderizar o emblema da delegação.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível salvar</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "create"
                    ? "Criando..."
                    : "Salvando..."
                  : mode === "create"
                    ? "Criar delegação"
                    : "Salvar alterações"}
              </Button>
              <Link
                to="/leagues/$leagueId/dashboard/delegations"
                params={{ leagueId: String(leagueId) }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Cancelar e voltar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
