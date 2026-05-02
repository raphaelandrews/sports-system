import type { SwissBracket, Match, Team } from "@/types/bracketcore";
import { MatchCard } from "@/features/bracket/components/match-card";
import { cn } from "@sports-system/ui/lib/utils";

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 17 5-5-5-5" />
      <path d="m13 17 5-5-5-5" />
    </svg>
  );
}

export interface SwissStageProps {
  bracket: SwissBracket;
  className?: string;
  onMatchClick?: (match: Match) => void;
}

type TeamRecord = { wins: number; losses: number };

function getTeamRecord(teamId: string, history: Match[]): TeamRecord {
  let wins = 0;
  let losses = 0;

  for (const match of history) {
    if (match.status !== "completed") continue;
    const teamEntry = match.teams.find((t) => t.team?.id === teamId);
    if (!teamEntry) continue;

    if (teamEntry.isWinner) wins++;
    else losses++;
  }
  return { wins, losses };
}

function getTeamsWithRecord(bracket: SwissBracket, wins: number, losses: number): Team[] {
  return bracket.standings.filter((s) => s.wins === wins && s.losses === losses).map((s) => s.team);
}

function getMatchesForPool(
  roundMatches: Match[],
  completedMatchesInBracket: Match[],
  targetWins: number,
  targetLosses: number,
): Match[] {
  if (!roundMatches) return [];
  return roundMatches.filter((match) => {
    const team1 = match.teams[0]?.team;

    if (!team1) return false;

    const history = completedMatchesInBracket.filter(
      (m) => m.id !== match.id && m.round < (match.round ?? 999),
    );
    const rec = getTeamRecord(team1.id, history);

    return rec.wins === targetWins && rec.losses === targetLosses;
  });
}

function TeamListBlock({
  teams,
  record,
  title,
  type,
}: {
  teams: Team[];
  record: string;
  title?: string;
  type: "good" | "bad";
}) {
  const isGood = type === "good";

  if (teams.length === 0) return null;

  return (
    <div
      className={cn(
        "w-48 rounded-md border flex flex-col overflow-hidden shrink-0",
        isGood ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20",
      )}
    >
      <div
        className={cn(
          "px-3 py-1.5 text-xs font-bold flex justify-between items-center border-b",
          isGood
            ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
            : "text-red-500 border-red-500/20 bg-red-500/10",
        )}
      >
        <span>{record.replace("-", ":")}</span>
        {title && <span className="opacity-70">{title}</span>}
      </div>
      <div className="flex flex-col p-1 gap-1">
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            {team.logo ? (
              <img src={team.logo} className="w-4 h-4 object-contain" alt={team.name} />
            ) : (
              <div className="w-4 h-4 bg-foreground/10 rounded-full" />
            )}
            <span className="text-xs font-medium truncate">{team.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchPoolBlock({
  matches,
  record,
  onMatchClick,
  nextUp,
  nextDown,
  isLast,
  isFinal,
}: {
  matches: Match[];
  record: string;
  onMatchClick?: (m: Match) => void;
  nextUp?: boolean;
  nextDown?: boolean;
  isLast?: boolean;
  isFinal?: boolean;
}) {
  if (matches.length === 0) {
    if (!isLast) return <div className="w-48 h-24" />;
    return null;
  }

  return (
    <div className="relative group/pool">
      <div className="text-xs font-medium text-muted-foreground mb-1.5 pl-1 opacity-70">
        {record.replace("-", ":")}
      </div>

      <div className="flex flex-col gap-3 relative">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onMatchClick={onMatchClick}
            className="w-48 text-xs"
          />
        ))}

        {nextUp && (
          <div
            className={cn(
              "absolute text-emerald-500/50 group-hover/pool:text-emerald-500 transition-colors",
              isFinal ? "right-1/2 -top-8 translate-x-1/2" : "-right-10 -top-4",
            )}
          >
            <div className="relative">
              <ArrowIcon className={cn("w-6 h-6", isFinal ? "-rotate-90" : "-rotate-30")} />
            </div>
          </div>
        )}
        {nextDown && (
          <div
            className={cn(
              "absolute text-red-500/50 group-hover/pool:text-red-500 transition-colors",
              isFinal ? "right-1/2 -bottom-8 translate-x-1/2" : "-right-10 -bottom-4",
            )}
          >
            <ArrowIcon className={cn("w-6 h-6", isFinal ? "rotate-90" : "rotate-30")} />
          </div>
        )}
      </div>
    </div>
  );
}

export function SwissStage({ bracket, className, onMatchClick }: SwissStageProps) {
  const allMatches = bracket.rounds.flatMap((r) => r.matches);

  const r1 = bracket.rounds[0]?.matches || [];
  const r2 = bracket.rounds[1]?.matches || [];
  const r3 = bracket.rounds[2]?.matches || [];
  const r4 = bracket.rounds[3]?.matches || [];
  const r5 = bracket.rounds[4]?.matches || [];

  const pool0_0 = getMatchesForPool(r1, allMatches, 0, 0);

  const pool1_0 = getMatchesForPool(r2, allMatches, 1, 0);
  const pool0_1 = getMatchesForPool(r2, allMatches, 0, 1);

  const pool2_0 = getMatchesForPool(r3, allMatches, 2, 0);
  const pool1_1 = getMatchesForPool(r3, allMatches, 1, 1);
  const pool0_2 = getMatchesForPool(r3, allMatches, 0, 2);

  const teams3_0 = getTeamsWithRecord(bracket, 3, 0);
  const pool2_1 = getMatchesForPool(r4, allMatches, 2, 1);
  const pool1_2 = getMatchesForPool(r4, allMatches, 1, 2);
  const teams0_3 = getTeamsWithRecord(bracket, 0, 3);

  const teams3_1 = getTeamsWithRecord(bracket, 3, 1);
  const teams3_2 = getTeamsWithRecord(bracket, 3, 2);
  const pool2_2 = getMatchesForPool(r5, allMatches, 2, 2);
  const teams2_3 = getTeamsWithRecord(bracket, 2, 3);
  const teams1_3 = getTeamsWithRecord(bracket, 1, 3);

  return (
    <div className={cn("p-6 overflow-x-auto", className)}>
      <div className="flex gap-16 min-w-max">
        <div className="flex flex-col justify-center">
          <MatchPoolBlock
            matches={pool0_0}
            record="0-0"
            onMatchClick={onMatchClick}
            nextUp
            nextDown
          />
        </div>

        <div className="flex flex-col justify-center gap-24">
          <MatchPoolBlock
            matches={pool1_0}
            record="1-0"
            onMatchClick={onMatchClick}
            nextUp
            nextDown
          />
          <MatchPoolBlock
            matches={pool0_1}
            record="0-1"
            onMatchClick={onMatchClick}
            nextUp
            nextDown
          />
        </div>

        <div className="flex flex-col justify-center gap-16">
          <MatchPoolBlock
            matches={pool2_0}
            record="2-0"
            onMatchClick={onMatchClick}
            nextUp
            nextDown
          />
          <div className="py-2">
            <MatchPoolBlock
              matches={pool1_1}
              record="1-1"
              onMatchClick={onMatchClick}
              nextUp
              nextDown
            />
          </div>
          <MatchPoolBlock
            matches={pool0_2}
            record="0-2"
            onMatchClick={onMatchClick}
            nextUp
            nextDown
          />
        </div>

        <div className="flex flex-col relative py-2">
          <div className="mb-auto">
            <TeamListBlock teams={teams3_0} record="3-0" type="good" />
          </div>

          <div className="flex flex-col gap-12 my-12 justify-center">
            <MatchPoolBlock
              matches={pool2_1}
              record="2-1"
              onMatchClick={onMatchClick}
              nextUp
              nextDown
            />
            <MatchPoolBlock
              matches={pool1_2}
              record="1-2"
              onMatchClick={onMatchClick}
              nextUp
              nextDown
            />
          </div>

          <div className="mt-auto">
            <TeamListBlock teams={teams0_3} record="0-3" type="bad" />
          </div>
        </div>

        <div className="flex flex-col relative py-2">
          <div className="mb-auto space-y-4">
            <TeamListBlock teams={teams3_1} record="3-1" type="good" />
            <TeamListBlock teams={teams3_2} record="3-2" type="good" />
          </div>

          <div className="my-12 flex flex-col justify-center">
            <MatchPoolBlock
              matches={pool2_2}
              record="2-2"
              onMatchClick={onMatchClick}
              nextUp
              nextDown
              isFinal
            />
          </div>

          <div className="mt-auto space-y-4">
            <TeamListBlock teams={teams2_3} record="2-3" type="bad" />
            <TeamListBlock teams={teams1_3} record="1-3" type="bad" />
          </div>
        </div>
      </div>
    </div>
  );
}
