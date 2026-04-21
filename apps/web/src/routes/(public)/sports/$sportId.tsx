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

import { sportDetailQueryOptions } from "@/queries/sports";
import type { Gender, SportType } from "@/types/sports";

export const Route = createFileRoute("/(public)/sports/$sportId")({
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(sportDetailQueryOptions(Number(params.sportId))),
  component: SportDetailPage,
});

const typeLabel: Record<SportType, string> = {
  INDIVIDUAL: "Individual",
  TEAM: "Coletivo",
};

const genderLabel: Record<Gender, string> = {
  M: "Masculino",
  F: "Feminino",
  MIXED: "Misto",
};

function SportDetailPage() {
  const { sportId } = Route.useParams();
  const { data } = useSuspenseQuery(sportDetailQueryOptions(Number(sportId)));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Badge variant="secondary">{typeLabel[data.sport_type]}</Badge>
          {!data.is_active && (
            <Badge variant="destructive">Inativo</Badge>
          )}
        </div>
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        {data.description && (
          <p className="text-muted-foreground mt-2">{data.description}</p>
        )}
        {data.player_count != null && (
          <p className="text-sm text-muted-foreground mt-1">
            {data.player_count}{" "}
            {data.sport_type === "INDIVIDUAL"
              ? "atleta(s) por partida"
              : "jogador(es) por time"}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Modalidades</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Gênero</TableHead>
              <TableHead>Categoria</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.modalities.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{genderLabel[m.gender]}</TableCell>
                <TableCell>{m.category ?? "—"}</TableCell>
              </TableRow>
            ))}
            {data.modalities.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-muted-foreground text-center"
                >
                  Nenhuma modalidade cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
