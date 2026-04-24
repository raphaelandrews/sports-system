import type { GroupStageBracket, Match, Group } from "@/types/bracketcore";
import { MatchCard } from "@/components/bracketcore/match-card";
import { cn } from "@sports-system/ui/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/bracketcore/table";

export interface GroupStageProps {
  bracket: GroupStageBracket;
  className?: string;
  onMatchClick?: (match: Match) => void;
}

function GroupTable({ group }: { group: Group }) {
  return (
    <div className="rounded border border-border bg-card">
      <h3 className="text-sm font-medium px-3 py-2 border-b border-border">{group.name}</h3>
      <Table>
        <TableHeader>
          <TableRow className="text-muted-foreground">
            <TableHead>#</TableHead>
            <TableHead>Team</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">+/-</TableHead>
            <TableHead className="text-center">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {group.standings.map((s, i) => (
            <TableRow key={s.team.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell className="flex items-center gap-2">
                {s.team.logo && (
                  <img src={s.team.logo} alt={s.team.name} className="h-4 w-4 object-contain" />
                )}
                {s.team.name}
              </TableCell>
              <TableCell className="text-center tabular-nums">{s.wins}</TableCell>
              <TableCell className="text-center tabular-nums">{s.draws}</TableCell>
              <TableCell className="text-center tabular-nums">{s.losses}</TableCell>
              <TableCell className="text-center tabular-nums">
                {s.differential > 0 ? `+${s.differential}` : s.differential}
              </TableCell>
              <TableCell className="text-center tabular-nums font-medium">{s.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function GroupMatches({
  group,
  onMatchClick,
}: {
  group: Group;
  onMatchClick?: (match: Match) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-sm font-medium text-muted-foreground">{group.name} — Matches</h4>
      <div className="flex flex-wrap gap-4">
        {group.matches.map((match) => (
          <MatchCard key={match.id} match={match} onMatchClick={onMatchClick} />
        ))}
      </div>
    </div>
  );
}

export function GroupStage({ bracket, className, onMatchClick }: GroupStageProps) {
  return (
    <div className={cn("flex flex-col gap-8 p-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bracket.groups.map((group) => (
          <GroupTable key={group.name} group={group} />
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {bracket.groups.map((group) => (
          <GroupMatches key={group.name} group={group} onMatchClick={onMatchClick} />
        ))}
      </div>
    </div>
  );
}
