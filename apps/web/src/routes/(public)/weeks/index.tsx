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
import { Link, createFileRoute } from "@tanstack/react-router";

import { formatDate } from "@/lib/date";
import { weekListQueryOptions } from "@/queries/weeks";
import type { WeekStatus } from "@/types/weeks";

export const Route = createFileRoute("/(public)/weeks/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(weekListQueryOptions()),
  component: WeeksPage,
});

const statusVariant: Record<
  WeekStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SCHEDULED: "secondary",
  LOCKED: "secondary",
  ACTIVE: "default",
  COMPLETED: "outline",
};

const statusLabel: Record<WeekStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  LOCKED: "Bloqueada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
};

function WeeksPage() {
  const { data } = useSuspenseQuery(weekListQueryOptions());

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Semanas de Competição</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Semana</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Esportes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((week) => (
            <TableRow key={week.id}>
              <TableCell>
                <Link
                  to="/weeks/$weekId"
                  params={{ weekId: String(week.id) }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Semana {week.week_number}
                </Link>
              </TableCell>
              <TableCell>
                {formatDate(week.start_date)} – {formatDate(week.end_date)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[week.status]}>
                  {statusLabel[week.status]}
                </Badge>
              </TableCell>
              <TableCell>{week.sport_focus.length}</TableCell>
            </TableRow>
          ))}
          {data.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                Nenhuma semana cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
