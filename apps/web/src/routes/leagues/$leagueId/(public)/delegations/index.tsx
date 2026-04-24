import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { delegationListQueryOptions } from "@/queries/delegations";

export const Route = createFileRoute("/leagues/$leagueId/(public)/delegations/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(delegationListQueryOptions(Number(leagueId))),
  component: DelegationsPage,
});

function DelegationsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(delegationListQueryOptions(Number(leagueId)));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Delegações</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-mono text-sm">{d.code}</TableCell>
              <TableCell>
                <Link
                  to="/leagues/$leagueId/delegations/$delegationId"
                  params={{ leagueId, delegationId: String(d.id) }}
                  className="underline-offset-4 hover:underline"
                >
                  {d.name}
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {data.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground text-center">
                Nenhuma delegação cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
