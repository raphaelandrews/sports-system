import { Badge } from "@sports-system/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { cn } from "@/lib/utils";

export interface BracketMatchItem {
  id: string;
  label: string;
  teamA: string;
  teamB: string;
  score?: string;
  status: string;
  href?: string;
}

export interface BracketRound {
  id: string;
  title: string;
  matches: BracketMatchItem[];
}

export function BracketView({
  rounds,
  emptyLabel = "Nenhuma partida no chaveamento.",
}: {
  rounds: BracketRound[];
  emptyLabel?: string;
}) {
  if (rounds.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-muted/15 p-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-max auto-cols-[minmax(18rem,1fr)] grid-flow-col gap-4">
        {rounds.map((round) => (
          <section key={round.id} className="space-y-3">
            <div className="flex items-center justify-between gap-3 px-1">
              <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {round.title}
              </h3>
              <Badge variant="outline">{round.matches.length}</Badge>
            </div>
            {round.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatchItem }) {
  const content = (
    <Card className="border-border/70 bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))] shadow-sm transition hover:border-primary/40">
      <CardHeader className="gap-3 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{match.label}</CardTitle>
          <Badge variant="secondary">{match.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <TeamRow name={match.teamA} emphasized={Boolean(match.score)} />
        <TeamRow name={match.teamB} emphasized={Boolean(match.score)} />
        <div className="rounded-2xl bg-background/75 px-3 py-2 text-center text-sm font-semibold">
          {match.score ?? "Aguardando placar"}
        </div>
      </CardContent>
    </Card>
  );

  if (!match.href) {
    return content;
  }

  return (
    <a
      href={match.href}
      className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </a>
  );
}

function TeamRow({
  name,
  emphasized,
}: {
  name: string;
  emphasized: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 px-3 py-2 text-sm",
        emphasized && "bg-muted/30",
      )}
    >
      {name}
    </div>
  );
}
