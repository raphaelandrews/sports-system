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

import * as m from "@/paraglide/messages";
import { userSearchQueryOptions } from "@/features/users/api/queries";
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
  leagueId: number;
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
  leagueId,
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
          <CardTitle>{mode === "create" ? m['athlete.form.title.create']() : m['athlete.form.title.edit']()}</CardTitle>
          <CardDescription>
            {roleScope === "admin"
              ? m['athlete.form.desc.admin']()
              : m['athlete.form.desc.chief']()}
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
                      ? { message: m['athlete.form.error.name']() }
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="athlete-name">{m['athlete.form.label.name']()}</FieldLabel>
                    <Input
                      id="athlete-name"
                      placeholder={m['athlete.form.placeholder.name']()}
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
                      ? { message: m['athlete.form.error.code']() }
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="athlete-code">{m['athlete.form.label.code']()}</FieldLabel>
                    <Input
                      id="athlete-code"
                      placeholder={m['athlete.form.placeholder.code']()}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      {m['athlete.form.desc.code']()}
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-5 md:grid-cols-2">
                <form.Field name="gender">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="athlete-gender">{m['athlete.form.label.gender']()}</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as AthleteFormValues["gender"])
                        }
                      >
                        <SelectTrigger id="athlete-gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">{m['athlete.form.gender.none']()}</SelectItem>
                          <SelectItem value="M">{m['athlete.form.gender.male']()}</SelectItem>
                          <SelectItem value="F">{m['athlete.form.gender.female']()}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </form.Field>

                <form.Field name="birthdate">
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="athlete-birthdate">{m['athlete.form.label.birthdate']()}</FieldLabel>
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
                <AlertTitle>{m['athlete.form.alert.error']()}</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? m['athlete.form.submitting']() : m['athlete.form.submit']()}
              </Button>
              <Link
                to="/leagues/$leagueId/dashboard/athletes"
                params={{ leagueId: String(leagueId) }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {m['athlete.form.cancel']()}
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
      <FieldLabel htmlFor="athlete-user-search">{m['athlete.form.label.linkedUser']()}</FieldLabel>
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="athlete-user-search"
            className="pl-9"
            placeholder={m['athlete.form.searchPlaceholder']()}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {linkedUserId ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/25 p-3 text-sm">
            <Badge variant="secondary">{m['athlete.form.linkedUserBadge']({ linkedUserId })}</Badge>
            <span className="text-muted-foreground">{linkedUserLabel ?? m['athlete.form.linkedUserFallback']()}</span>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              {m['athlete.form.unlinkButton']()}
            </Button>
          </div>
        ) : null}

        {search.trim().length >= 2 ? (
          <div className="space-y-2">
            {isFetching ? (
              <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                {m['athlete.form.searchLoading']()}
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
                    {m['athlete.form.linkButton']()}
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 p-4 text-sm text-muted-foreground">
                {m['athlete.form.searchEmpty']()}
              </div>
            )}
          </div>
        ) : (
          <FieldDescription>
            {m['athlete.form.desc.linkedUser']()}
          </FieldDescription>
        )}
      </div>
    </Field>
  );
}
