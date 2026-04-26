import type { Match, MatchTeam } from "@/types/bracketcore";
import { cn } from "@sports-system/ui/lib/utils";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatSchedule(value: Date | string): { time: string; day: string } {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return { time: "", day: String(value) };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

  if (diffDays === 0) return { time, day: "Today" };
  if (diffDays === 1) return { time, day: "Tomorrow" };
  if (diffDays > 1 && diffDays < 7) return { time, day: WEEKDAYS[date.getDay()]! };
  return { time, day: `${MONTHS[date.getMonth()]} ${date.getDate()}` };
}

export interface MatchCardProps {
  match: Match;
  className?: string;
  onMatchClick?: (match: Match) => void;
  variant?: "default" | "bordered";
}

function TeamRow({
  entry,
  isLive,
  isLeading,
  variant = "default",
}: {
  entry: MatchTeam;
  isLive?: boolean;
  isLeading?: boolean;
  variant?: "default" | "bordered";
}) {
  const isWinner = entry.isWinner === true;
  const isLoser = entry.isWinner === false;
  const showBorders = variant === "bordered";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5",
        showBorders && "border-l-3",
        showBorders && isWinner && "border-l-emerald-500",
        showBorders && isLoser && "border-l-destructive",
        showBorders && !isWinner && !isLoser && "border-l-transparent",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {entry.team?.logo && (
          <img
            src={entry.team.logo}
            alt={entry.team.name}
            className="h-4 w-4 shrink-0 object-contain"
          />
        )}
        <span
          className={cn(
            "truncate text-sm leading-none",
            isWinner && "font-semibold text-card-foreground",
            isLoser && "text-card-foreground/40",
            !isWinner && !isLoser && "text-card-foreground",
            !entry.team && "text-muted-foreground",
          )}
        >
          {entry.team?.name ?? "TBD"}
        </span>
      </div>
      <span
        className={cn(
          "text-sm tabular-nums shrink-0 leading-none font-medium",
          isLive && isLeading && "text-emerald-500",
          isLive && isLeading === false && "text-destructive",
          !isLive && isWinner && "text-card-foreground",
          !isLive && isLoser && "text-card-foreground/40",
        )}
      >
        {entry.score}
      </span>
    </div>
  );
}

export function MatchCard({ match, className, onMatchClick, variant = "default" }: MatchCardProps) {
  const bestOfLabel = match.bestOf ? `BO${match.bestOf}` : undefined;
  const isLive = match.status === "live";
  const isCompleted = match.status === "completed";
  const hasHeader = !isCompleted && (isLive || match.scheduledAt || bestOfLabel);

  return (
    <div
      className={cn(
        "relative w-(--bracket-match-width,11rem) shadow-sm",
        hasHeader ? "rounded-b-sm" : "rounded-sm",
        "border-border",
        "bg-card",
        "text-card-foreground",
        "shadow-sm overflow-visible",
        isLive && "border-destructive border",
        onMatchClick && "cursor-pointer hover:border-primary/50 transition-colors",
        className,
      )}
      onClick={onMatchClick ? () => onMatchClick(match) : undefined}
    >
      {hasHeader && (
        <div
          className={cn(
            "absolute bottom-full flex items-center justify-between px-2.5 py-1 text-xs rounded-t-sm",
            isLive ? "-inset-x-px" : "inset-x-0",
            isLive ? "text-primary bg-destructive" : "text-muted-foreground bg-muted",
          )}
        >
          <span className="flex items-center gap-1.5">
            {isLive && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                <span className="font-semibold uppercase">Live</span>
              </>
            )}
            {!isLive &&
              match.scheduledAt &&
              (() => {
                const schedule = formatSchedule(match.scheduledAt!);
                return (
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-[10px] mt-[1px]">{schedule.time}</span>
                    <span>{schedule.day}</span>
                  </span>
                );
              })()}
            {!isLive && !match.scheduledAt && <span>Unscheduled</span>}
          </span>
          {bestOfLabel && (
            <span className={cn("ml-auto", isLive && "font-semibold")}>{bestOfLabel}</span>
          )}
        </div>
      )}
      <TeamRow
        entry={match.teams[0]}
        isLive={isLive}
        variant={isCompleted ? variant : "default"}
        isLeading={
          isLive
            ? match.teams[0].score > match.teams[1].score
              ? true
              : match.teams[0].score < match.teams[1].score
                ? false
                : undefined
            : undefined
        }
      />
      <div className="border-t border-border" />
      <TeamRow
        entry={match.teams[1]}
        isLive={isLive}
        variant={isCompleted ? variant : "default"}
        isLeading={
          isLive
            ? match.teams[1].score > match.teams[0].score
              ? true
              : match.teams[1].score < match.teams[0].score
                ? false
                : undefined
            : undefined
        }
      />
    </div>
  );
}
