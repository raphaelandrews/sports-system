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
import { competitionListQueryOptions } from "@/queries/competitions";
import type { CompetitionStatus } from "@/types/competitions";

export const Route = createFileRoute("/(public)/competitions/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(competitionListQueryOptions()),
  component: CompetitionsPage,
});

const statusVariant: Record<
  CompetitionStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "outline",
  SCHEDULED: "secondary",
  LOCKED: "secondary",
  ACTIVE: "default",
  COMPLETED: "outline",
};

const statusLabel: Record<CompetitionStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  LOCKED: "Bloqueada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
};

function CompetitionsPage() {
  const { data } = useSuspenseQuery(competitionListQueryOptions());

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Competições</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Competição</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Esportes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((competition) => (
            <TableRow key={competition.id}>
              <TableCell>
                <Link
                  to="/competitions/$competitionId"
                  params={{ competitionId: String(competition.id) }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  Competição {competition.number}
                </Link>
              </TableCell>
              <TableCell>
                {formatDate(competition.start_date)} – {formatDate(competition.end_date)}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[competition.status]}>
                  {statusLabel[competition.status]}
                </Badge>
              </TableCell>
              <TableCell>{competition.sport_focus.length}</TableCell>
            </TableRow>
          ))}
          {data.data.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-center">
                Nenhuma competição cadastrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
