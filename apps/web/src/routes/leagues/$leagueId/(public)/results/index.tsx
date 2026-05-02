import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { MedalBoard } from "@/features/results/components/medal-board";
import { medalBoardQueryOptions } from "@/features/results/api/queries";
import { sportListQueryOptions } from "@/features/sports/api/queries";

export const Route = createFileRoute("/leagues/$leagueId/(public)/results/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    Promise.all([
      queryClient.ensureQueryData(medalBoardQueryOptions(Number(leagueId))),
      queryClient.ensureQueryData(sportListQueryOptions()),
    ]),
  component: ResultsPage,
});

function ResultsPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery({
    ...medalBoardQueryOptions(Number(leagueId)),
    refetchInterval: 30_000,
  });
  const { data: sports } = useSuspenseQuery(sportListQueryOptions());

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Atualiza a cada 30s</Badge>
            </div>
            <CardTitle className="text-3xl">Quadro de medalhas</CardTitle>
            <CardDescription className="max-w-2xl">
              Painel público da competição com ranking geral das delegações.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickPill label="Delegações no ranking" value={String(data.length)} />
            <QuickPill
              label="Ouros distribuídos"
              value={String(data.reduce((sum, entry) => sum + entry.gold, 0))}
            />
            <QuickPill
              label="Medalhas totais"
              value={String(data.reduce((sum, entry) => sum + entry.total, 0))}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Navegação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/leagues/$leagueId/results/records"
              params={{ leagueId }}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Ver recordes e melhores marcas
            </Link>
            {sports.data.slice(0, 6).map((sport) => (
              <Link
                key={sport.id}
                to="/leagues/$leagueId/results/sports/$sportId"
                params={{ leagueId, sportId: String(sport.id) }}
                className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                {sport.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <MedalBoard entries={data} />
    </div>
  );
}

function QuickPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/80 p-4">
      <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
