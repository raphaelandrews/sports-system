import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@sports-system/ui/components/field";
import { Input } from "@sports-system/ui/components/input";
import { ArrowLeftRight, Clock3 } from "lucide-react";

import {
  ChiefDelegationShell,
  ChiefDelegationUnavailable,
} from "@/components/delegations/chief-delegation-shell";
import {
  findManagedDelegation,
  getTransferWindowMessage,
  isTransferWindowOpen,
} from "@/lib/chief-delegation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatEventDate } from "@/lib/date";
import {
  delegationHistoryQueryOptions,
  delegationInvitesQueryOptions,
  delegationListQueryOptions,
} from "@/queries/delegations";
import { queryKeys } from "@/queries/keys";

export const Route = createFileRoute(
  "/_authenticated/dashboard/_chief/my-delegation/transfers",
)({
  ssr: false,
  loader: async ({ context: { queryClient, session } }) => {
    const delegations = await queryClient.ensureQueryData(delegationListQueryOptions());
    const managed = findManagedDelegation(delegations.data, session);

    if (!managed) {
      return { delegationId: null };
    }

    await Promise.all([
      queryClient.ensureQueryData(delegationInvitesQueryOptions(managed.id)),
      queryClient.ensureQueryData(delegationHistoryQueryOptions(managed.id)),
    ]);

    return { delegationId: managed.id };
  },
  component: TransferPanelPage,
});

function TransferPanelPage() {
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const { delegationId } = Route.useLoaderData();
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions());
  const delegation = findManagedDelegation(delegations.data, session);
  const [userId, setUserId] = useState("");
  const transferOpen = isTransferWindowOpen();

  const transferMutation = useMutation({
    mutationFn: async (targetUserId: number) =>
      apiFetch(`/delegations/${delegationId}/transfer/${targetUserId}`, {
        method: "POST",
      }),
    onSuccess: async () => {
      if (!delegationId) return;
      setUserId("");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.invites(delegationId),
      });
      toast.success("Transferencia solicitada.");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : "Falha ao solicitar transferencia.",
      );
    },
  });

  if (!delegation || !delegationId) {
    return (
      <ChiefDelegationShell
        title="Transferencias"
        description="Abertura de transferencias apenas dentro da janela permitida."
        delegation={delegation}
      >
        <ChiefDelegationUnavailable />
      </ChiefDelegationShell>
    );
  }

  const { data: invites } = useSuspenseQuery(delegationInvitesQueryOptions(delegationId));
  const { data: history } = useSuspenseQuery(delegationHistoryQueryOptions(delegationId));

  return (
    <ChiefDelegationShell
      title="Transferencias"
      description="Solicite entrada de atletas vindos de outra delegacao quando a janela semanal estiver aberta."
      delegation={delegation}
    >
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Solicitar transferencia</CardTitle>
            <CardDescription>
              A rota do backend exige um user_id que hoje esteja vinculado a outra delegacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert variant={transferOpen ? "default" : "destructive"}>
              <Clock3 className="size-4" />
              <AlertTitle>
                {transferOpen ? "Janela ativa" : "Janela indisponivel"}
              </AlertTitle>
              <AlertDescription>{getTransferWindowMessage()}</AlertDescription>
            </Alert>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="transfer-user-id">User ID</FieldLabel>
                <Input
                  id="transfer-user-id"
                  inputMode="numeric"
                  placeholder="Ex: 88"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                />
                <FieldDescription>
                  O backend rejeita usuario sem delegacao atual ou fora da janela de segunda-feira.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <Button
              type="button"
              disabled={transferMutation.isPending || !transferOpen || Number(userId) <= 0}
              onClick={() => transferMutation.mutate(Number(userId))}
            >
              <ArrowLeftRight className="size-4" />
              {transferMutation.isPending ? "Solicitando..." : "Solicitar transferencia"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Pendencias atuais</CardTitle>
            <CardDescription>
              Como o backend compartilha a fila de convites, acompanhe aqui entradas ainda aguardando aceite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.length > 0 ? (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="rounded-2xl border border-border/70 bg-muted/25 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">Usuario #{invite.user_id}</div>
                      <div className="text-sm text-muted-foreground">
                        Criado em {formatEventDate(invite.created_at)}
                      </div>
                    </div>
                    <Badge variant="secondary">{invite.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                Nenhuma solicitacao pendente.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Historico util para auditoria</CardTitle>
          <CardDescription>
            Consulte a linha do tempo recente da delegacao antes de abrir novas movimentacoes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length > 0 ? (
            history.slice(-8).reverse().map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border/70 bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">{item.user_name}</div>
                  <Badge variant="outline">{item.role}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {formatEventDate(item.joined_at, { dateStyle: "medium" })}
                  {" - "}
                  {item.left_at
                    ? formatEventDate(item.left_at, { dateStyle: "medium" })
                    : "vinculo ativo"}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
              Sem historico suficiente para exibir.
            </div>
          )}
        </CardContent>
      </Card>
    </ChiefDelegationShell>
  );
}
