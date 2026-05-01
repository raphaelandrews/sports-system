import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@sports-system/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";

import { resolveRosterSize } from "@/shared/lib/sports";
import { sportListQueryOptions } from "@/features/sports/api/queries";
import type { SportType } from "@/types/sports";
import { TableLayout } from "@/shared/components/ui/table-layout";

export const Route = createFileRoute("/leagues/$leagueId/(public)/sports/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(sportListQueryOptions()),
  component: SportsPage,
});

const typeLabel: Record<SportType, string> = {
  INDIVIDUAL: "Individual",
  TEAM: "Coletivo",
};

function SportsPage() {
  const { data } = useSuspenseQuery(sportListQueryOptions());
  const { leagueId } = Route.useParams();
  const sports = data.data;

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return sports;
    const lower = searchQuery.toLowerCase();
    return sports.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        typeLabel[s.sport_type].toLowerCase().includes(lower),
    );
  }, [sports, searchQuery]);

  const pagedData = filteredData.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  return (
    <TableLayout
      title="Esportes"
      countLabel="esportes"
      visibleCount={pagedData.length}
      totalCount={filteredData.length}
      searchPlaceholder="Buscar esportes…"
      searchQuery={searchQuery}
      onSearchChange={(value) => {
        setSearchQuery(value);
        setPageIndex(0);
      }}
      activeFilterCount={searchQuery ? 1 : 0}
      onClearFilters={() => {
        setSearchQuery("");
        setPageIndex(0);
      }}
      pageIndex={pageIndex}
      pageSize={pageSize}
      onPageChange={setPageIndex}
      onPageSizeChange={setPageSize}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="ps-4">Nome</TableHead>
            <TableHead className="w-32">Tipo</TableHead>
            <TableHead className="pe-4 w-40">Atletas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedData.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={3}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhum esporte encontrado.
              </TableCell>
            </TableRow>
          )}
          {pagedData.map((sport) => (
            <TableRow key={sport.id}>
              <TableCell className="ps-4">
                <Link
                  to="/leagues/$leagueId/sports/$sportId"
                  params={{ leagueId, sportId: String(sport.id) }}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {sport.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{typeLabel[sport.sport_type]}</Badge>
              </TableCell>
              <TableCell className="pe-4 text-muted-foreground text-sm">
                {sport.player_count != null
                  ? sport.sport_type === "INDIVIDUAL"
                    ? `${sport.player_count} atleta(s)`
                    : `${resolveRosterSize(sport.player_count, sport.rules_json)} atleta(s) por equipe`
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableLayout>
  );
}
