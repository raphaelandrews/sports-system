import { Badge } from "@sports-system/ui/components/badge";
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

import { formatDate } from "@/lib/date";
import { delegationDetailQueryOptions } from "@/queries/delegations";

export const Route = createFileRoute("/(public)/delegations/$delegationId")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(
      delegationDetailQueryOptions(Number(params.delegationId)),
    ),
  component: DelegationDetailPage,
});

function DelegationDetailPage() {
  const { delegationId } = Route.useParams();
  const { data } = useSuspenseQuery(
    delegationDetailQueryOptions(Number(delegationId)),
  );

  const activeMembers = data.members.filter((m) => !m.left_at);
  const formerMembers = data.members.filter((m) => m.left_at);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {data.code}
          </span>
          {!data.is_active && (
            <Badge variant="destructive">Inativa</Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold">{data.name}</h1>
      </div>

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
