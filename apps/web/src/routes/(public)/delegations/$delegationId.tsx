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
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DelegationStatisticsPanel } from "@/components/delegations/delegation-statistics-panel";
import { formatDate } from "@/lib/date";
import {
  delegationDetailQueryOptions,
  delegationStatisticsQueryOptions,
} from "@/queries/delegations";

export const Route = createFileRoute("/(public)/delegations/$delegationId")({
  loader: ({ context: { queryClient }, params }) => {
    const delegationId = Number(params.delegationId);
    void queryClient.prefetchQuery(delegationStatisticsQueryOptions(delegationId))
    return queryClient.ensureQueryData(delegationDetailQueryOptions(delegationId))
  },
  component: DelegationDetailPage,
});

function DelegationDetailPage() {
  const { delegationId } = Route.useParams();
  const numericDelegationId = Number(delegationId);
  const { data } = useSuspenseQuery(
    delegationDetailQueryOptions(Number(delegationId)),
  );
  const { data: stats } = useSuspenseQuery(
    delegationStatisticsQueryOptions(numericDelegationId),
  );

  const activeMembers = data.members.filter((m) => !m.left_at);
  const formerMembers = data.members.filter((m) => m.left_at);

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-6">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
          <CardHeader className="gap-3">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {data.code}
              </span>
              {!data.is_active && (
                <Badge variant="destructive">Inativa</Badge>
              )}
            </div>
            <CardTitle className="text-3xl font-semibold">{data.name}</CardTitle>
            <CardDescription className="max-w-2xl">
              Perfil publico da delegacao com quadro completo de atletas, medalhas e recorte historico por semana.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Resumo rapido</CardTitle>
            <CardDescription>
              Leitura imediata da campanha acumulada desta delegacao.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
              <div className="font-medium">{stats.total_medals} medalhas</div>
              <div className="text-muted-foreground">
                {stats.gold} ouro · {stats.silver} prata · {stats.bronze} bronze
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
              <div className="font-medium">{stats.athlete_count} atletas</div>
              <div className="text-muted-foreground">
                {stats.active_athlete_count} ativos · {stats.total_matches} partidas
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <DelegationStatisticsPanel
        stats={stats}
        title="Campanha completa"
        description="Todos os atletas associados, medalhas registradas e desempenho historico da delegacao por semana."
      />

      <div>
        <h2 className="text-lg font-medium mb-3">Membros ativos</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Desde</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeMembers.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.user_name}</TableCell>
                <TableCell>{m.role}</TableCell>
                <TableCell>{formatDate(m.joined_at.split("T")[0])}</TableCell>
              </TableRow>
            ))}
            {activeMembers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground text-center"
                >
                  Nenhum membro ativo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {formerMembers.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Ex-membros</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead>Até</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formerMembers.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.user_name}</TableCell>
                  <TableCell>{m.role}</TableCell>
                  <TableCell>
                    {formatDate(m.joined_at.split("T")[0])}
                  </TableCell>
                  <TableCell>
                    {m.left_at ? formatDate(m.left_at.split("T")[0]) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
