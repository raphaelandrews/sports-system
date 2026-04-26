import { Badge } from "@sports-system/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sports-system/ui/components/table";

import type { MedalBoardEntry } from "@/types/results";

export function MedalBoard({
  entries,
  compact = false,
}: {
  entries: MedalBoardEntry[];
  compact?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-14">#</TableHead>
          <TableHead>Delegação</TableHead>
          <TableHead className="text-center">🥇</TableHead>
          <TableHead className="text-center">🥈</TableHead>
          <TableHead className="text-center">🥉</TableHead>
          <TableHead className="text-center">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, index) => (
          <TableRow key={entry.delegation_id}>
            <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{entry.delegation_name}</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] uppercase tracking-[0.2em]"
                >
                  {entry.delegation_code}
                </Badge>
              </div>
            </TableCell>
            <TableCell className="text-center font-semibold">{entry.gold}</TableCell>
            <TableCell className="text-center font-semibold">{entry.silver}</TableCell>
            <TableCell className="text-center font-semibold">{entry.bronze}</TableCell>
            <TableCell className="text-center font-bold">{entry.total}</TableCell>
          </TableRow>
        ))}
        {entries.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className={
                compact
                  ? "py-6 text-center text-muted-foreground"
                  : "py-10 text-center text-muted-foreground"
              }
            >
              Nenhuma medalha registrada ainda.
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
