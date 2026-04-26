import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@sports-system/ui/components/empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@sports-system/ui/components/tabs";
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MedalBoard } from "@/components/results/medal-board";
import { SportStandings } from "@/components/results/sport-standings";
import { modalityStandingsQueryOptions, sportMedalBoardQueryOptions } from "@/queries/results";
import { sportDetailQueryOptions } from "@/queries/sports";

export const Route = createFileRoute("/leagues/$leagueId/(public)/results/sports/$sportId/")({
  loader: async ({ context: { queryClient }, params: { leagueId, sportId } }) => {
    const numericLeagueId = Number(leagueId);
    const numericSportId = Number(sportId);
    const sport = await queryClient.ensureQueryData(sportDetailQueryOptions(numericSportId));

    await Promise.all([
      queryClient.ensureQueryData(sportMedalBoardQueryOptions(numericLeagueId, numericSportId)),
      ...sport.modalities.map((modality) =>
        queryClient.ensureQueryData(modalityStandingsQueryOptions(numericLeagueId, modality.id)),
      ),
    ]);
  },
  component: SportResultsPage,
});

function SportResultsPage() {
  const { leagueId, sportId } = Route.useParams();
  const numericLeagueId = Number(leagueId);
  const numericSportId = Number(sportId);
  const { data: sport } = useSuspenseQuery(sportDetailQueryOptions(numericSportId));
  const { data: medalBoard } = useSuspenseQuery(
    sportMedalBoardQueryOptions(numericLeagueId, numericSportId),
  );
  const standings = useSuspenseQueries({
    queries: sport.modalities.map((modality) =>
      modalityStandingsQueryOptions(numericLeagueId, modality.id),
    ),
  });

  const defaultTab = sport.modalities[0]?.id ? String(sport.modalities[0].id) : "overview";

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="border border-border/70 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%),linear-gradient(180deg,hsl(var(--card)),hsl(var(--muted)/0.18))]">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Resultados por esporte</Badge>
              <Badge variant="secondary">{sport.sport_type}</Badge>
            </div>
            <CardTitle className="text-3xl">{sport.name}</CardTitle>
            {sport.description ? <CardDescription>{sport.description}</CardDescription> : null}
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <QuickPill label="Modalidades" value={String(sport.modalities.length)} />
            <QuickPill label="Delegações pontuando" value={String(medalBoard.length)} />
            <QuickPill
              label="Medalhas no esporte"
              value={String(medalBoard.reduce((sum, entry) => sum + entry.total, 0))}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/70">
          <CardHeader>
            <CardTitle>Quadro do esporte</CardTitle>
          </CardHeader>
          <CardContent>
            <MedalBoard entries={medalBoard} compact />
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border/70">
        <CardHeader>
          <CardTitle>Classificações por modalidade</CardTitle>
          <CardDescription>
            Cada aba mostra a classificação já registrada para uma modalidade do esporte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sport.modalities.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Nenhuma modalidade cadastrada</EmptyTitle>
                <EmptyDescription>
                  Este esporte ainda não possui modalidades configuradas.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Tabs defaultValue={defaultTab}>
              <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
                {sport.modalities.map((modality) => (
                  <TabsTrigger key={modality.id} value={String(modality.id)}>
                    {modality.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sport.modalities.map((modality, index) => (
                <TabsContent key={modality.id} value={String(modality.id)} className="mt-4">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{modality.gender}</Badge>
                    {modality.category ? (
                      <Badge variant="secondary">{modality.category}</Badge>
                    ) : null}
                  </div>
                  <SportStandings entries={standings[index].data} />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
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
