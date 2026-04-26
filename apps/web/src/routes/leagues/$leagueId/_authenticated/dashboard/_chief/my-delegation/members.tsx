import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";

import {
  ChiefActionButton,
  ChiefDelegationShell,
  ChiefDelegationUnavailable,
} from "@/features/delegations/components/chief-delegation-shell";
import { findManagedDelegation } from "@/shared/lib/chief-delegation";
import { client, unwrap, ApiError } from "@/shared/lib/api";
import { formatEventDate } from "@/shared/lib/date";
import {
  delegationDetailQueryOptions,
  delegationHistoryQueryOptions,
  delegationInvitesQueryOptions,
  delegationListQueryOptions,
} from "@/features/delegations/api/queries";
import { queryKeys } from "@/features/keys";

export const Route = createFileRoute(
  "/leagues/$leagueId/_authenticated/dashboard/_chief/my-delegation/members",
)({
  ssr: false,
  loader: async ({ context: { queryClient, session }, params: { leagueId } }) => {
    const delegations = await queryClient.ensureQueryData(
      delegationListQueryOptions(Number(leagueId)),
    );
    const managed = findManagedDelegation(delegations.data, session!);

    if (!managed) {
      return { delegationId: null };
    }

    void queryClient.prefetchQuery(delegationDetailQueryOptions(Number(leagueId), managed.id));
    void queryClient.prefetchQuery(delegationHistoryQueryOptions(Number(leagueId), managed.id));
    void queryClient.prefetchQuery(delegationInvitesQueryOptions(Number(leagueId), managed.id));
    return { delegationId: managed.id };
  },
  component: DelegationMembersPage,
});

function DelegationMembersPage() {
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const { delegationId } = Route.useLoaderData();
  const { leagueId } = Route.useParams();
  const { data: delegations } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));
  const delegation = findManagedDelegation(delegations.data, session!);

  const revokeMutation = useMutation({
    mutationFn: async (inviteId: number) =>
      unwrap(
        client.DELETE("/leagues/{league_id}/delegations/{delegation_id}/invites/{invite_id}", {
          params: {
            path: {
              league_id: Number(leagueId),
              delegation_id: delegationId!,
              invite_id: inviteId,
            },
          },
        }),
      ),
    onSuccess: async () => {
      if (!delegationId) return;
      await queryClient.invalidateQueries({
        queryKey: queryKeys.delegations.invites(Number(leagueId), delegationId),
      });
      toast.success("Convite revogado.");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Falha ao revogar convite.");
    },
  });

  if (!delegation || !delegationId) {
    return (
      <ChiefDelegationShell
        title="Membros e convites"
        description="Controle de quem compoe a delegacao e quais acessos aguardam resposta."
        leagueId={leagueId}
        delegation={delegation}
      >
        <ChiefDelegationUnavailable />
      </ChiefDelegationShell>
    );
  }

  const { data: detail } = useSuspenseQuery(
    delegationDetailQueryOptions(Number(leagueId), delegationId),
  );
  const { data: history } = useSuspenseQuery(
    delegationHistoryQueryOptions(Number(leagueId), delegationId),
  );
  const { data: invites } = useSuspenseQuery(
    delegationInvitesQueryOptions(Number(leagueId), delegationId),
  );

  return (
    <ChiefDelegationShell
      title="Membros e convites"
      description="Painel do chefe para revisar equipe atual, historico preservado e pendencias de entrada."
      leagueId={leagueId}
      delegation={delegation}
    >
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Membros ativos</CardTitle>
            <CardDescription>Lista operacional da composicao atual da delegacao.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Funcao</TableHead>
                  <TableHead>Entrada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.user_name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{member.user_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatEventDate(member.joined_at, { dateStyle: "medium" })}
                    </TableCell>
                  </TableRow>
                ))}
                {detail.members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      Nenhum membro ativo nesta delegacao.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Convites pendentes</CardTitle>
            <CardDescription>
              Convites ainda sem aceite. Voce pode revogar antes da resposta.
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
                  <div className="mt-3">
                    <ChiefActionButton
                      pending={revokeMutation.isPending}
                      idleLabel="Revogar convite"
                      busyLabel="Revogando..."
                      onClick={() => revokeMutation.mutate(invite.id)}
                      variant="outline"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 p-6 text-sm text-muted-foreground">
                Nenhum convite pendente no momento.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Historico de vinculos</CardTitle>
          <CardDescription>Auditoria simples das entradas e saidas da delegacao.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
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
              Sem historico adicional para exibir.
            </div>
          )}
        </CardContent>
      </Card>
    </ChiefDelegationShell>
  );
}
