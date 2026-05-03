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

import { resolveRosterSize } from "@/shared/lib/sports";
import { sportDetailQueryOptions } from "@/features/sports/api/queries";
import type { Gender, SportType } from "@/types/sports";
import * as m from "@/paraglide/messages";

export const Route = createFileRoute("/leagues/$leagueId/(public)/sports/$sportId")({
  loader: ({ context: { queryClient }, params: { sportId } }) =>
    queryClient.ensureQueryData(sportDetailQueryOptions(Number(sportId))),
  component: SportDetailPage,
});

function getTypeLabel(type: SportType): string {
  return type === "INDIVIDUAL"
    ? m['sport.detail.type.individual']()
    : m['sport.detail.type.team']();
}

function getGenderLabel(gender: Gender): string {
  switch (gender) {
    case "M":
      return m['sport.detail.gender.male']();
    case "F":
      return m['sport.detail.gender.female']();
    case "MIXED":
      return m['sport.detail.gender.mixed']();
  }
}

function SportDetailPage() {
  const { sportId, leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(sportDetailQueryOptions(Number(sportId)));

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-1">
                <Badge variant="secondary">{getTypeLabel(data.sport_type)}</Badge>
          {!data.is_active &&                 <Badge variant="destructive">{m['sport.detail.status.inactive']()}</Badge>}
        </div>
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        {data.description && <p className="text-muted-foreground mt-2">{data.description}</p>}
        {data.player_count != null && (
          <p className="text-sm text-muted-foreground mt-1">
            {data.sport_type === "INDIVIDUAL"
              ? `${data.player_count} atleta(s) por prova`
              : `${resolveRosterSize(data.player_count, data.rules_json)} atleta(s) por equipe · ${data.player_count} em jogo`}
          </p>
        )}
        <Link
          to="/leagues/$leagueId/sports/$sportId/bracket"
          params={{ leagueId, sportId }}
          className="mt-4 inline-flex text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Ver chaveamento
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">{m['sport.detail.modalitiesHeading']()}</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{m['sport.detail.table.name']()}</TableHead>
              <TableHead>{m['sport.detail.table.gender']()}</TableHead>
              <TableHead>{m['sport.detail.table.category']()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.modalities.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.name}</TableCell>
                <TableCell>{getGenderLabel(m.gender)}</TableCell>
                <TableCell>{m.category ?? "—"}</TableCell>
              </TableRow>
            ))}
            {data.modalities.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">
                  {m['sport.detail.empty.modalities']()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
