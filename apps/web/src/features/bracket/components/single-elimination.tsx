import type { SingleEliminationBracket, Match } from "@/types/bracketcore";
import { MatchCard } from "@/features/bracket/components/match-card";
import { cn } from "@sports-system/ui/lib/utils";

export interface SingleEliminationProps {
  bracket: SingleEliminationBracket;
  className?: string;
  onMatchClick?: (match: Match) => void;
  connectorStyle?: "default" | "simple";
}

export function SingleElimination({
  bracket,
  className,
  onMatchClick,
  connectorStyle = "default",
}: SingleEliminationProps) {
  const rounds = bracket.rounds;

  return (
    <div className={cn("inline-flex overflow-x-auto rounded-lg p-6", className)}>
      {rounds.map((round, roundIdx) => {
        const isLast = roundIdx === rounds.length - 1;
        return (
          <div key={round.name} className="flex">
            <RoundColumn
              roundIdx={roundIdx}
              name={round.name}
              matches={round.matches}
              onMatchClick={onMatchClick}
            />
            {!isLast && (
              <ConnectorColumn
                roundIdx={roundIdx}
                sourceCount={round.matches.length}
                style={connectorStyle}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoundColumn({
  roundIdx,
  name,
  matches,
  onMatchClick,
}: {
  roundIdx: number;
  name: string;
  matches: Match[];
  onMatchClick?: (match: Match) => void;
}) {
  const exp = Math.pow(2, roundIdx);

  return (
    <div className="flex flex-col items-center shrink-0">
      <div className="text-xs font-medium text-muted-foreground mb-3 whitespace-nowrap">{name}</div>
      <div
        className="flex flex-col"
        style={
          {
            "--_base":
              "calc(var(--bracket-match-height, calc(3.25rem + 1px)) + var(--bracket-match-gap, 1rem))",
            "--_slot": `calc(${exp} * var(--_base))`,
          } as React.CSSProperties
        }
      >
        {matches.map((match) => (
          <div
            key={match.id}
            className="flex items-center"
            style={
              {
                height: "var(--_slot)",
              } as React.CSSProperties
            }
          >
            <div
              style={
                {
                  height: "var(--bracket-match-height, calc(3.25rem + 1px))",
                } as React.CSSProperties
              }
            >
              <MatchCard match={match} onMatchClick={onMatchClick} className="h-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectorColumn({
  roundIdx,
  sourceCount,
  style,
}: {
  roundIdx: number;
  sourceCount: number;
  style: "default" | "simple";
}) {
  const pairCount = Math.floor(sourceCount / 2);
  const exp = Math.pow(2, roundIdx);

  return (
    <div className="flex flex-col shrink-0">
      {/* Invisible spacer matching the round name height */}
      <div className="text-xs mb-3 invisible" aria-hidden="true">
        &nbsp;
      </div>
      <div
        className="flex flex-col"
        style={
          {
            "--_base":
              "calc(var(--bracket-match-height, calc(3.25rem + 1px)) + var(--bracket-match-gap, 1rem))",
            "--_pair-h": `calc(${exp * 2} * var(--_base))`,
            width: "var(--bracket-round-gap, 3rem)",
          } as React.CSSProperties
        }
      >
        {Array.from({ length: pairCount }, (_, i) => {
          if (style === "simple") {
            return (
              <div
                key={i}
                className="relative w-full"
                style={{ height: `var(--_pair-h)` }}
                aria-hidden
              >
                {/* Top Path: Source(25%) -> Target Top Team Row (approx 50% - 1/4 match height) */}
                <div
                  className="absolute border-t border-r border-border"
                  style={{
                    top: "25%",
                    right: "50%",
                    width: "50%",
                    height: "calc(25% - var(--bracket-match-height, calc(3.25rem + 1px)) * 0.25)",
                  }}
                />
                {/* Connector to target top row */}
                <div
                  className="absolute border-b border-border"
                  style={{
                    top: "calc(50% - var(--bracket-match-height, calc(3.25rem + 1px)) * 0.25)",
                    left: "50%",
                    width: "50%",
                  }}
                />

                {/* Bot Path: Source(75%) -> Target Bot Team Row (approx 50% + 1/4 match height) */}
                <div
                  className="absolute border-b border-r border-border"
                  style={{
                    bottom: "25%",
                    right: "50%",
                    width: "50%",
                    height: "calc(25% - var(--bracket-match-height, calc(3.25rem + 1px)) * 0.25)",
                  }}
                />
                {/* Connector to target bot row */}
                <div
                  className="absolute border-b border-border"
                  style={{
                    bottom: "calc(50% - var(--bracket-match-height, calc(3.25rem + 1px)) * 0.25)",
                    left: "50%",
                    width: "50%",
                  }}
                />
              </div>
            );
          }

          return (
            <svg
              key={i}
              className="w-full text-border"
              style={{ height: `var(--_pair-h)` }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path
                d={["M 0 25 H 50", "M 0 75 H 50", "M 50 25 V 75", "M 50 50 H 100"].join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          );
        })}
      </div>
    </div>
  );
}
