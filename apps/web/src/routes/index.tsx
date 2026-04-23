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

import { allEventsQueryOptions } from "@/queries/events";
import { medalBoardQueryOptions } from "@/queries/results";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(medalBoardQueryOptions()),
      queryClient.ensureQueryData(allEventsQueryOptions({ per_page: 5 })),
    ]),
  component: HomePage,
});

function HomePage() {
  const { data: medalBoard } = useSuspenseQuery(medalBoardQueryOptions());
  const { data: eventsData } = useSuspenseQuery(
    allEventsQueryOptions({ per_page: 5 }),
  );
  const events = eventsData.data;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 space-y-12">
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          Sistema de Competições Esportivas
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Acompanhe resultados, calendário e delegações da competição
          multi-esportiva por semanas.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            to="/results"
            className="underline-offset-4 hover:underline font-medium"
          >
            Ver quadro de medalhas →
          </Link>
          <Link
            to="/calendar"
            className="underline-offset-4 hover:underline font-medium"
          >
            Ver calendário →
          </Link>
          <Link
            to="/feed"
            className="underline-offset-4 hover:underline font-medium"
          >
            Ver feed ao vivo →
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Quadro de Medalhas</h2>
          <Link
            to="/results"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Ver completo
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Delegação</TableHead>
              <TableHead className="text-center">🥇</TableHead>
              <TableHead className="text-center">🥈</TableHead>
              <TableHead className="text-center">🥉</TableHead>
              <TableHead className="text-center">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medalBoard.slice(0, 5).map((entry, i) => (
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
            {medalBoard.length === 0 && (
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
      </section>

      {events.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Próximos eventos</h2>
            <Link
              to="/calendar"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Ver calendário
            </Link>
          </div>
          <div className="divide-y rounded-lg border">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm">{ev.event_date}</span>
                <span className="text-sm font-medium">{ev.phase}</span>
                <span className="text-sm text-muted-foreground">
                  {ev.venue ?? "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
