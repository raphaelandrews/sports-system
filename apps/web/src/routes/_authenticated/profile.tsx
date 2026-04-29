import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useState, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@sports-system/ui/components/button";
import { Field, FieldLabel } from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { Avatar, AvatarFallback } from "@sports-system/ui/components/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";

import { sessionQueryOptions } from "@/features/auth/api/queries";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { buildApiUrl } from "@/shared/lib/url";
import { queryKeys } from "@/features/keys";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function getAccessToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
  return match ? match.split("=")[1] : undefined;
}

async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(buildApiUrl("/upload/avatar"), {
    method: "POST",
    body: formData,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(json.detail ?? "Upload failed");
  }

  const json = await res.json();
  return json.url as string;
}

function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSuspenseQuery(sessionQueryOptions());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string>(session.avatar_url ?? "");
  const [serverError, setServerError] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadAvatar,
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    },
  });

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
      toast.success("Perfil atualizado com sucesso.");
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    try {
      const url = await uploadMutation.mutateAsync(file);
      setPreviewAvatar(url);
      form.setFieldValue("avatar_url", url);
    } catch {
      // error handled by mutation
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Meu perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
          <CardDescription>Atualize seu nome e foto de perfil.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            {previewAvatar ? (
              <img
                key={previewAvatar}
                src={previewAvatar}
                alt={session.name}
                className="h-20 w-20 rounded-md object-cover"
                onError={() => {
                  console.error("Avatar image failed to load:", previewAvatar);
                  toast.error("Falha ao carregar a imagem.");
                }}
              />
            ) : (
              <Avatar className="h-20 w-20 rounded-md">
                <AvatarFallback className="text-2xl rounded-md">
                  {session.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Enviando..." : "Alterar foto"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-xs text-muted-foreground">PNG, JPG ou GIF. Máx. 2MB.</p>
            </div>
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
                  !value.trim() ? "Nome é obrigatório" : undefined,
              }}
            >
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="name">Nome</FieldLabel>
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
                  <FieldLabel htmlFor="avatar_url">URL da imagem</FieldLabel>
                  <Input
                    id="avatar_url"
                    placeholder="https://..."
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
              <FieldLabel>E-mail</FieldLabel>
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
                    {isSubmitting ? "Salvando..." : "Salvar alterações"}
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
