import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@sports-system/ui/components/select";

import * as m from "@/paraglide/messages";
import type { Gender, ModalityResponse } from "@/types/sports";

type ModalityFormValues = {
  name: string;
  gender: Gender;
  category: string;
  rules_json_text: string;
};

interface ModalityFormProps {
  mode: "create" | "edit";
  sportName: string;
  sportId: number;
  leagueId: number;
  defaultValues?: Partial<ModalityResponse>;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onSubmit: (value: {
    name: string;
    gender: Gender;
    category?: string;
    rules_json: Record<string, unknown>;
  }) => Promise<void>;
}

export function ModalityForm({
  mode,
  sportName,
  sportId,
  leagueId,
  defaultValues,
  isSubmitting = false,
  errorMessage,
  onSubmit,
}: ModalityFormProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? "",
      gender: defaultValues?.gender ?? "MIXED",
      category: defaultValues?.category ?? "",
      rules_json_text: JSON.stringify(defaultValues?.rules_json ?? {}, null, 2),
    } satisfies ModalityFormValues,
    onSubmit: async ({ value }) => {
      try {
        const parsed = JSON.parse(value.rules_json_text) as Record<string, unknown>;
        setJsonError(null);

        await onSubmit({
          name: value.name.trim(),
          gender: value.gender,
          ...(value.category.trim() ? { category: value.category.trim() } : {}),
          rules_json: parsed,
        });
      } catch {
        setJsonError(m['modality.form.error.json']());
      }
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Card className="border border-border/70 bg-gradient-to-br from-card via-card to-muted/20">
        <CardHeader>
          <CardTitle>{mode === "create" ? m['modality.form.title.create']() : m['modality.form.title.edit']()}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? `${m['modality.form.desc.create']()} ${sportName}.`
              : `${m['modality.form.desc.edit']()} ${sportName}.`}
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
                      ? { message: m['modality.form.error.name']() }
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="modality-name">{m['modality.form.label.name']()}</FieldLabel>
                    <Input
                      id="modality-name"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder={m['modality.form.placeholder.name']()}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="gender">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="modality-gender">{m['modality.form.label.gender']()}</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value as Gender)}
                    >
                      <SelectTrigger id="modality-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">{m['modality.form.gender.male']()}</SelectItem>
                        <SelectItem value="F">{m['modality.form.gender.female']()}</SelectItem>
                        <SelectItem value="MIXED">{m['modality.form.gender.mixed']()}</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="category">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="modality-category">{m['modality.form.label.category']()}</FieldLabel>
                    <Input
                      id="modality-category"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                      placeholder={m['modality.form.placeholder.category']()}
                    />
                    <FieldDescription>
                      {m['modality.form.desc.category']()}
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>

              <form.Field name="rules_json_text">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="modality-rules">{m['modality.form.label.rules']()}</FieldLabel>
                    <textarea
                      id="modality-rules"
                      className="min-h-64 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      {m['modality.form.rulesExamplePrefix']()}{" "}
                      {`{"max_athletes": 12, "substitutes": 6, "gender": "M", "schedule_conflict_check": true}`}
                    </FieldDescription>
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            {jsonError ? (
              <Alert variant="destructive">
                <AlertTitle>{m['modality.form.alert.jsonTitle']()}</AlertTitle>
                <AlertDescription>{jsonError}</AlertDescription>
              </Alert>
            ) : null}

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>{m['modality.form.alert.saveTitle']()}</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "create"
                    ? m['modality.form.submitting.create']()
                    : m['modality.form.submitting.edit']()
                  : mode === "create"
                    ? m['modality.form.submit.create']()
                    : m['modality.form.submit.edit']()}
              </Button>
              <Link
                to="/leagues/$leagueId/dashboard/sports/$sportId"
                params={{ leagueId: String(leagueId), sportId: String(sportId) }}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {m['modality.form.cancel']()}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
