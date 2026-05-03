import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
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
  standaloneDelegationDetailQueryOptions,
  delegationLeaguesQueryOptions,
} from "@/features/delegations/api/queries";

export const Route = createFileRoute("/delegations/$delegationId/")({
  loader: ({ context: { queryClient }, params: { delegationId } }) =>
    Promise.all([
      queryClient.ensureQueryData(standaloneDelegationDetailQueryOptions(Number(delegationId))),
      queryClient.ensureQueryData(delegationLeaguesQueryOptions(Number(delegationId))),
    ]),
  component: StandaloneDelegationPage,
});

const statusLabel: Record<string, string> = {
  INDEPENDENT: "Independente",
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  REJECTED: "Rejeitada",
};

function StandaloneDelegationPage() {
  const { delegationId } = Route.useParams();
  const numericId = Number(delegationId);
  const { data } = useSuspenseQuery(standaloneDelegationDetailQueryOptions(numericId));
  const { data: leagues } = useSuspenseQuery(delegationLeaguesQueryOptions(numericId));

  const activeMembers = data.members.filter((m: any) => !m.left_at);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-6">
      <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(160deg,hsl(var(--card)),hsl(var(--card)),hsl(var(--muted)/0.22))]">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {data.code}
            </span>
            {!data.is_active && <Badge variant="destructive">Inativa</Badge>}
            <Badge variant="outline">{statusLabel[data.status] ?? data.status}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 rounded-xl">
              <AvatarImage src={data.flag_url ?? ""} alt={data.name} />
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-lg">
                {data.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl font-semibold">{data.name}</CardTitle>
            </div>
          </div>
          <CardDescription>
            Criada em {new Date(data.created_at).toLocaleDateString("pt-BR")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ligas</CardTitle>
          <CardDescription>
            Participando em {leagues.length} liga{leagues.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leagues.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Esta delegação ainda não participa de nenhuma liga.
            </p>
          ) : (
            <div className="rounded-xl border bg-card shadow-xs/5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-28 text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leagues.map((league: any) => (
                    <TableRow key={league.id}>
                      <TableCell className="font-medium">{league.name}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          to="/leagues/$leagueId"
                          params={{ leagueId: String(league.id) }}
                          className="text-sm text-primary hover:underline"
                        >
                          Ver liga
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membros</CardTitle>
          <CardDescription>
            {activeMembers.length} membro{activeMembers.length !== 1 ? "s" : ""} ativo
            {activeMembers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeMembers.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum membro ativo.</p>
          ) : (
            <div className="rounded-xl border bg-card shadow-xs/5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-28">Função</TableHead>
                    <TableHead className="w-36">Entrou em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMembers.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-xs">
                          {new Date(member.joined_at).toLocaleDateString("pt-BR")}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
