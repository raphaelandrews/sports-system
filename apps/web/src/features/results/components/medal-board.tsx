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
import * as m from "@/paraglide/messages";

export function MedalBoard({
  entries,
  compact = false,
}: {
  entries: MedalBoardEntry[];
  compact?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card shadow-xs/5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="ps-4 w-14">#</TableHead>
            <TableHead>{m['results.public.table.delegation']()}</TableHead>
            <TableHead className="text-center">🥇</TableHead>
            <TableHead className="text-center">🥈</TableHead>
            <TableHead className="text-center">🥉</TableHead>
            <TableHead className="pe-4 text-center">{m['competition.detail.table.total']()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => (
            <TableRow key={entry.delegation_id}>
              <TableCell className="ps-4 font-medium text-muted-foreground">{index + 1}</TableCell>
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
              <TableCell className="pe-4 text-center font-bold">{entry.total}</TableCell>
            </TableRow>
          ))}
          {entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className={
                  compact
                    ? "h-24 text-center text-muted-foreground"
                    : "h-24 text-center text-muted-foreground"
                }
              >
                {m["results.public.empty"]()}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
