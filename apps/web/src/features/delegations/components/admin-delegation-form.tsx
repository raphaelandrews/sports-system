import { useState } from "react";
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

import * as m from "@/paraglide/messages";
import { ImageUpload } from "@/shared/components/ui/image-upload";
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
  const [previewUrl, setPreviewUrl] = useState(defaultValues?.flag_url ?? "");

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
          <CardTitle>{mode === "create" ? m['delegation.form.title.create']() : m['delegation.form.title.edit']()}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? m['delegation.form.desc.create']()
              : m['delegation.form.desc.edit']()}
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
                      ? { message: m['delegation.form.error.name']() }
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="delegation-name">{m['delegation.form.label.name']()}</FieldLabel>
                    <Input
                      id="delegation-name"
                      placeholder={m['delegation.form.placeholder.name']()}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      {m['delegation.form.desc.name']()}
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
                      ? { message: m['delegation.form.error.code']() }
                      : undefined,
                }}
                >
                  {(field) => (
                    <Field>
                      <FieldLabel htmlFor="delegation-code">{m['delegation.form.label.code']()}</FieldLabel>
                      <Input
                        id="delegation-code"
                        placeholder={m['delegation.form.placeholder.code']()}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) => field.handleChange(event.target.value)}
                      />
                      <FieldDescription>
                        {m['delegation.form.desc.code']()}
                      </FieldDescription>
                      <FieldError errors={field.state.meta.errors} />
                    </Field>
                  )}
                </form.Field>
              ) : (
                <Alert>
                  <Sparkles className="size-4" />
                  <AlertTitle>{m['delegation.form.alert.codeTitle']()}</AlertTitle>
                  <AlertDescription>
                    {m['delegation.form.alert.codeDesc']()}
                  </AlertDescription>
                </Alert>
              )}

              <ImageUpload
                value={previewUrl}
                onChange={(url) => {
                  setPreviewUrl(url);
                  form.setFieldValue("flag_url", url);
                }}
                label={m['delegation.form.label.image']()}
                fallback={form.getFieldValue("name")?.charAt(0) || "?"}
              />

              <form.Field
                name="flag_url"
                validators={{
                  onChange: ({ value }) =>
                    value.trim() && !/^https?:\/\/.+/i.test(value.trim())
                      ? { message: m['delegation.form.error.imageUrl']() }
                      : undefined,
                }}
              >
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="delegation-flag-url">{m['delegation.form.label.imageUrl']()}</FieldLabel>
                    <Input
                      id="delegation-flag-url"
                      placeholder={m['delegation.form.placeholder.imageUrl']()}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        field.handleChange(event.target.value);
                        setPreviewUrl(event.target.value);
                      }}
                    />
                    <FieldDescription>
                      {m['delegation.form.desc.imageUrl']()}
                    </FieldDescription>
                    <FieldError errors={field.state.meta.errors} />
                  </Field>
                )}
              </form.Field>
            </FieldGroup>

            {errorMessage ? (
              <Alert variant="destructive">
                <AlertTitle>{m['delegation.form.alert.error']()}</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "create"
                    ? m['delegation.form.submitting.create']()
                    : m['delegation.form.submitting.edit']()
                  : mode === "create"
                    ? m['delegation.form.submit.create']()
                    : m['delegation.form.submit.edit']()}
              </Button>
              {leagueId > 0 ? (
                <Link
                  to="/leagues/$leagueId/dashboard/delegations"
                  params={{ leagueId: String(leagueId) }}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {m['delegation.form.cancel']()}
                </Link>
              ) : (
                <Link
                  to="/my-delegations"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {m['delegation.form.cancel']()}
                </Link>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
