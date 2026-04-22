import { useDeferredValue, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
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
  FieldGroup,
  FieldLabel,
} from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { Search, UserPlus } from "lucide-react";

import {
  ChiefDelegationShell,
  ChiefDelegationUnavailable,
} from "@/components/delegations/chief-delegation-shell";
import { findManagedDelegation } from "@/lib/chief-delegation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatEventDate } from "@/lib/date";
import {
  delegationInvitesQueryOptions,
  delegationListQueryOptions,
} from "@/queries/delegations";
import { queryKeys } from "@/queries/keys";
import { userSearchQueryOptions } from "@/queries/users";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_chief/my-delegation/invite",
)({
  ssr: false,
  loader: async ({ context: { queryClient, session } }) => {
    const delegations = await queryClient.ensureQueryData(delegationListQueryOptions());
    const managed = findManagedDelegation(delegations.data, session);

    if (!managed) {
      return { delegationId: null };
    }

    await queryClient.ensureQueryData(delegationInvitesQueryOptions(managed.id));
    return { delegationId: managed.id };
  },
  component: InviteUserPage,
});

function InviteUserPage() {
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const { delegationId } = Route.useLoaderData();
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions());
  const delegation = findManagedDelegation(delegations.data, session);
  const [searchValue, setSearchValue] = useState("");
  const deferredSearch = useDeferredValue(searchValue);

  const inviteMutation = useMutation({
    mutationFn: async (targetUserId: number) =>
      apiFetch(`/delegations/${delegationId}/invite`, {
        method: "POST",
        body: { user_id: targetUserId },
      }),
    onSuccess: async () => {
      if (!delegationId) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.invites(delegationId),
      });
      toast.success("Convite enviado.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao enviar convite.");
    },
  });

  if (!delegation || !delegationId) {
    return (
      <ChiefDelegationShell
        title="Convidar usuario"
        description="Envio de convites para novos membros da delegacao."
        delegation={delegation}
      >
        <ChiefDelegationUnavailable />
      </ChiefDelegationShell>
    );
  }

  const { data: invites } = useSuspenseQuery(delegationInvitesQueryOptions(delegationId));
  const { data: searchResults = [], isFetching } = useQuery({
    ...userSearchQueryOptions(deferredSearch.trim()),
  });

  const pendingInviteIds = useMemo(
    () => new Set(invites.map((invite) => invite.user_id)),
    [invites],
  );

  const availableUsers = useMemo(
    () =>
      searchResults.filter((user) => !pendingInviteIds.has(user.id)),
    [pendingInviteIds, searchResults],
  );

  return (
    <ChiefDelegationShell
      title="Convidar usuario"
      description="Busque por nome ou email, revise os resultados e envie o convite com um clique."
      delegation={delegation}
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Buscar usuario</CardTitle>
            <CardDescription>
              Pesquisa autenticada para localizar usuarios ativos por nome ou email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert>
              <Search className="size-4" />
              <AlertTitle>Busca liberada</AlertTitle>
              <AlertDescription>
                Digite pelo menos 2 caracteres. Resultados ja convidados ficam separados abaixo.
              </AlertDescription>
            </Alert>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-search">Nome ou email</FieldLabel>
                <Input
                  id="invite-search"
                  placeholder="Ex: ana ou ana@time.com"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                />
              </Field>
            </FieldGroup>

            <div className="space-y-3">
              {searchValue.trim().length < 2 ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  Digite ao menos 2 caracteres para iniciar a busca.
                </div>
              ) : isFetching ? (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  Buscando usuarios...
                </div>
              ) : availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{user.id}</Badge>
                        <Badge variant="secondary">{user.role}</Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      disabled={inviteMutation.isPending}
                      onClick={() => inviteMutation.mutate(user.id)}
                    >
                      <UserPlus className="size-4" />
                      {inviteMutation.isPending ? "Enviando..." : "Convidar"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  Nenhum usuario elegivel encontrado para a busca atual.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
            <CardDescription>
              Fila atual para evitar duplicidade e acompanhar o que ainda aguarda resposta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {invites.length > 0 ? (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-2xl border border-border/70 bg-muted/25 p-4"
                  >
                    <div className="font-medium">Usuario #{invite.user_id}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Enviado em {formatEventDate(invite.created_at)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                  Nenhum convite encontrado para o filtro atual.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </ChiefDelegationShell>
  );
}
