import { Badge } from "@sports-system/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";

import type { Medal, SportStandingEntry } from "@/types/results";

const medalLabel: Record<Medal, string> = {
  GOLD: "Ouro",
  SILVER: "Prata",
  BRONZE: "Bronze",
};

export function SportStandings({
  entries,
}: {
  entries: SportStandingEntry[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">#</TableHead>
          <TableHead>Delegação / Atleta</TableHead>
          <TableHead>Medalha</TableHead>
          <TableHead>Valor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={`${entry.rank}-${entry.delegation_id ?? "d"}-${entry.athlete_id ?? "a"}`}>
            <TableCell className="font-semibold">{entry.rank}</TableCell>
            <TableCell>
              <div className="space-y-1">
                {entry.delegation_name ? <div className="font-medium">{entry.delegation_name}</div> : null}
                {entry.athlete_name ? (
                  <div className="text-sm text-muted-foreground">{entry.athlete_name}</div>
                ) : null}
              </div>
            </TableCell>
            <TableCell>
              {entry.medal ? <Badge variant="outline">{medalLabel[entry.medal]}</Badge> : "—"}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {entry.value_json ? JSON.stringify(entry.value_json) : "—"}
            </TableCell>
          </TableRow>
        ))}
        {entries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
              Nenhuma classificação disponível ainda.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
