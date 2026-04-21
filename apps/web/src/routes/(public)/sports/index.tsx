import { Badge } from "@sports-system/ui/components/badge";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { sportListQueryOptions } from "@/queries/sports";
import type { SportType } from "@/types/sports";

export const Route = createFileRoute("/(public)/sports/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(sportListQueryOptions()),
  component: SportsPage,
});

const typeLabel: Record<SportType, string> = {
  INDIVIDUAL: "Individual",
  TEAM: "Coletivo",
};

function SportsPage() {
  const { data } = useSuspenseQuery(sportListQueryOptions());

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold">Esportes</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.data.map((sport) => (
          <Link
            key={sport.id}
            to="/sports/$sportId"
            params={{ sportId: String(sport.id) }}
            className="block"
          >
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{sport.name}</CardTitle>
                  <Badge variant="secondary">
                    {typeLabel[sport.sport_type]}
                  </Badge>
                </div>
                {sport.player_count != null && (
                  <p className="text-muted-foreground text-sm">
                    {sport.player_count}{" "}
                    {sport.sport_type === "INDIVIDUAL"
                      ? "atleta(s)"
                      : "jogador(es) por time"}
                  </p>
                )}
              </CardHeader>
            </Card>
          </Link>
        ))}
        {data.data.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">
            Nenhum esporte cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
