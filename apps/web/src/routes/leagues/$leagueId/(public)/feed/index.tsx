import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ActivityFeed } from "@/features/activities/components/activity-feed";
import { activityFeedQueryOptions } from "@/features/activities/api/queries";

export const Route = createFileRoute("/leagues/$leagueId/(public)/feed/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(activityFeedQueryOptions(Number(leagueId), 40)),
  component: FeedPage,
});

function FeedPage() {
  const { leagueId } = Route.useParams();
  const { data } = useSuspenseQuery(activityFeedQueryOptions(Number(leagueId), 40));

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <CardTitle className="text-3xl">Feed de atividades</CardTitle>
            <CardDescription className="max-w-2xl">
              Linha do tempo global da competição com partidas iniciadas, eventos ao vivo,
              encerramentos e recordes recentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickPill label="Itens carregados" value={String(data.length)} />
            <QuickPill
              label="Partidas ao vivo"
              value={String(data.filter((item) => item.item_type === "MATCH_STARTED").length)}
            />
            <QuickPill
              label="Recordes recentes"
              value={String(data.filter((item) => item.item_type === "RECORD_SET").length)}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Navegação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/leagues/$leagueId/calendar"
              params={{ leagueId }}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Ver calendário público
            </Link>
            <Link
              to="/leagues/$leagueId/results"
              params={{ leagueId }}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Ver resultados e medalhas
            </Link>
            <Link
              to="/leagues/$leagueId/report"
              params={{ leagueId }}
              className="block text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              Abrir relatório final
            </Link>
          </CardContent>
        </Card>
      </section>

      <ActivityFeed initialItems={data} limit={40} />
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
