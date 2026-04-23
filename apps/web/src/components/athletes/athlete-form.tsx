import { useDeferredValue, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@sports-system/ui/components/alert";
import { Badge } from "@sports-system/ui/components/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";
import { Search } from "lucide-react";

import { userSearchQueryOptions } from "@/queries/users";
import type { AthleteResponse } from "@/types/athletes";

type AthleteFormValues = {
  name: string;
  code: string;
  gender: "M" | "F" | "NONE";
  birthdate: string;
  userSearch: string;
};

interface AthleteFormProps {
  mode: "create";
  roleScope: "admin" | "chief";
  defaultValues?: Partial<AthleteResponse>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (value: {
    name: string;
    code: string;
    gender?: "M" | "F";
    birthdate?: string;
    user_id?: number;
  }) => Promise<void>;
}

export function AthleteForm({
  mode,
  roleScope,
  defaultValues,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: AthleteFormProps) {
  const [linkedUserId, setLinkedUserId] = useState<number | null>(defaultValues?.user_id ?? null);
  const [linkedUserLabel, setLinkedUserLabel] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? "",
      code: defaultValues?.code ?? "",
      gender: defaultValues?.gender ?? "NONE",
      birthdate: defaultValues?.birthdate ?? "",
      userSearch: "",
    } satisfies AthleteFormValues,
    onSubmit: async ({ value }) => {
      await onSubmit({
        name: value.name.trim(),
        code: value.code.trim().toUpperCase(),
        ...(value.gender !== "NONE" ? { gender: value.gender } : {}),
        ...(value.birthdate ? { birthdate: value.birthdate } : {}),
        ...(linkedUserId ? { user_id: linkedUserId } : {}),
      });
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card className="border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Novo atleta" : "Editar atleta"}</CardTitle>
          <CardDescription>
            {roleScope === "admin"
              ? "Cadastre atletas globalmente e vincule um usuario quando fizer sentido."
              : "Cadastre atletas para sua delegacao e vincule um usuario opcionalmente."}
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
                      ? "Informe um nome com pelo menos 3 caracteres."
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="athlete-name">Nome</FieldLabel>
                    <Input
                      id="athlete-name"
                      placeholder="Ex: Ana Souza"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field
                name="code"
                validators={{
                  onChange: ({ value }) =>
                    value.trim().length < 3
                      ? "Use um codigo com pelo menos 3 caracteres."
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="athlete-code">Codigo</FieldLabel>
                    <Input
                      id="athlete-code"
                      placeholder="Ex: ATH-001"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      Sera enviado em caixa alta para manter padrao administrativo.
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-5 md:grid-cols-2">
                <form.Field name="gender">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="athlete-gender">Genero</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value as AthleteFormValues["gender"])}
                      >
                        <SelectTrigger id="athlete-gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Nao informar</SelectItem>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="birthdate">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="athlete-birthdate">Nascimento</FieldLabel>
                      <Input
                        id="athlete-birthdate"
                        type="date"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                    </Field>
                  )}
                </form.Field>
              </div>

              <LinkedUserSearch
                onSelect={(user) => {
                  setLinkedUserId(user.id);
                  setLinkedUserLabel(`${user.name} (${user.email})`);
                }}
                linkedUserId={linkedUserId}
                linkedUserLabel={linkedUserLabel}
                onClear={() => {
                  setLinkedUserId(null);
                  setLinkedUserLabel(null);
                }}
              />
            </FieldGroup>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>Nao foi possivel salvar</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Cadastrar atleta"}
              </Button>
              <Link
                to="/dashboard/athletes"
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

function LinkedUserSearch({
  linkedUserId,
  linkedUserLabel,
  onSelect,
  onClear,
}: {
  linkedUserId: number | null;
  linkedUserLabel: string | null;
  onSelect: (user: { id: number; name: string; email: string; role: string }) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { data: results = [], isFetching } = useQuery({
    ...userSearchQueryOptions(deferredSearch.trim()),
  });

  const filtered = useMemo(
    () => results.filter((user) => user.id !== linkedUserId),
    [linkedUserId, results],
  );

  return (
    <Field>
      <FieldLabel htmlFor="athlete-user-search">Usuario vinculado</FieldLabel>
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="athlete-user-search"
            className="pl-9"
            placeholder="Buscar usuario por nome ou email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {linkedUserId ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/25 p-3 text-sm">
            <Badge variant="secondary">Usuario #{linkedUserId}</Badge>
            <span className="text-muted-foreground">{linkedUserLabel ?? "Vinculado"}</span>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              Remover vinculo
            </Button>
          </div>
        ) : null}

        {search.trim().length >= 2 ? (
          <div className="space-y-2">
            {isFetching ? (
              <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                Buscando usuarios...
              </div>
            ) : filtered.length > 0 ? (
              filtered.slice(0, 6).map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => onSelect(user)}>
                    Vincular
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                Nenhum usuario encontrado.
              </div>
            )}
          </div>
        ) : (
          <FieldDescription>
            Opcional. Use a busca para relacionar o atleta a uma conta do sistema.
          </FieldDescription>
        )}
      </div>
    </Field>
  );
}
