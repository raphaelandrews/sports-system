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

import { medalBoardQueryOptions } from "@/queries/results";

export const Route = createFileRoute("/(public)/results/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(medalBoardQueryOptions()),
  component: ResultsPage,
});

function ResultsPage() {
  const { data } = useSuspenseQuery({
    ...medalBoardQueryOptions(),
    refetchInterval: 30_000,
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Quadro de Medalhas</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Delegação</TableHead>
            <TableHead className="text-center">🥇</TableHead>
            <TableHead className="text-center">🥈</TableHead>
            <TableHead className="text-center">🥉</TableHead>
            <TableHead className="text-center">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, i) => (
            <TableRow key={entry.delegation_id}>
              <TableCell className="font-medium">{i + 1}</TableCell>
              <TableCell>
                <span className="font-medium">{entry.delegation_name}</span>{" "}
                <span className="text-muted-foreground text-sm">
                  {entry.delegation_code}
                </span>
              </TableCell>
              <TableCell className="text-center">{entry.gold}</TableCell>
              <TableCell className="text-center">{entry.silver}</TableCell>
              <TableCell className="text-center">{entry.bronze}</TableCell>
              <TableCell className="text-center font-semibold">
                {entry.total}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground text-center"
              >
                Nenhuma medalha registrada ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
