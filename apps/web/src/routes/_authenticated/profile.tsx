import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@sports-system/ui/components/button";
import { Field, FieldLabel } from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";

import { sessionQueryOptions } from "@/features/auth/api/queries";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { ImageUpload } from "@/shared/components/ui/image-upload";
import { queryKeys } from "@/features/keys";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSuspenseQuery(sessionQueryOptions());
  const [previewAvatar, setPreviewAvatar] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    setPreviewAvatar(session.avatar_url ?? "");
  }, [session.avatar_url]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { name: string; avatar_url: string }) => {
      return unwrap(
        client.PATCH("/users/me", {
          body: payload,
        }),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.session() });
      await router.invalidate();
      toast.success(m["common.actions.update"]());
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setServerError(err.message);
        toast.error(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
        toast.error(err.message);
      }
    },
  });

  const form = useForm({
    defaultValues: {
      name: session.name,
      avatar_url: session.avatar_url ?? "",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      await updateMutation.mutateAsync(value);
    },
  });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Meu perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Atualize seu nome e foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            value={previewAvatar}
            onChange={(url) => {
              setPreviewAvatar(url);
              form.setFieldValue("avatar_url", url);
            }}
            label={m["profile.label.photo"]()}
            fallback={session.name.charAt(0)}
            endpoint="/upload/avatar"
            maxSizeMB={2}
          />

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
                  !value.trim() ? m["auth.register.nameRequired"]() : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="name">{m["profile.label.name"]()}</FieldLabel>
                  <Input
                    id="name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">{field.state.meta.errors[0]}</p>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="avatar_url">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="avatar_url">{m["profile.label.avatarUrl"]()}</FieldLabel>
                  <Input
                    id="avatar_url"
                    placeholder={m["profile.placeholder.avatar"]()}
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      setPreviewAvatar(e.target.value);
                    }}
                    onBlur={field.handleBlur}
                  />
                </Field>
              )}
            </form.Field>

            <div className="space-y-1">
              <FieldLabel>{m["profile.label.email"]()}</FieldLabel>
              <Input value={session.email} disabled />
              <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado.</p>
            </div>

            {serverError && (
              <p className="text-destructive text-sm">{serverError}</p>
            )}

            <div className="flex justify-end">
              <form.Subscribe selector={(s) => [s.isSubmitting, s.canSubmit]}>
                {([isSubmitting, canSubmit]) => (
                  <Button type="submit" disabled={isSubmitting || !canSubmit}>
                    {isSubmitting ? m["common.actions.save"]() : m["common.actions.save"]()}
                  </Button>
                )}
              </form.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
