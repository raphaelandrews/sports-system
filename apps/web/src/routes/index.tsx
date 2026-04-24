import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { cn } from "@sports-system/ui/lib/utils";
import { leagueListQueryOptions } from "@/queries/leagues";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(leagueListQueryOptions()),
  component: HomePage,
});

function HomePage() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());
  const { session } = Route.useRouteContext();

  const showcase = leagues.find((l) => l.is_showcase);
  const others = leagues.filter((l) => !l.is_showcase);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10 space-y-12">
      <section className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">Ligas Esportivas</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Descubra, participe e acompanhe ligas esportivas de todas as modalidades.
        </p>
        {session && (
          <div className="pt-2">
            <Link to="/leagues/new" className={cn(buttonVariants())}>
              Criar sua liga
            </Link>
          </div>
        )}
      </section>

      {showcase && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold">Liga em destaque</h2>
            <Badge variant="default" className="animate-pulse">
              Live
            </Badge>
          </div>
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle>{showcase.name}</CardTitle>
              <CardDescription>{showcase.slug}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{showcase.description ?? "Sem descrição"}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>{showcase.member_count} membros</span>
                <span>{showcase.timezone}</span>
              </div>
              <Link
                to="/leagues/$leagueId"
                params={{ leagueId: String(showcase.id) }}
                className={cn(buttonVariants({ variant: "secondary" }), "mt-4")}
              >
                Acessar liga →
              </Link>
            </CardContent>
          </Card>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Todas as ligas</h2>
            <Link
              to="/leagues"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Ver todas →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 6).map((league) => (
              <Card key={league.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{league.name}</CardTitle>
                  <CardDescription>{league.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {league.description ?? "Sem descrição"}
                  </p>
                  <Link
                    to="/leagues/$leagueId"
                    params={{ leagueId: String(league.id) }}
                    className={cn(buttonVariants({ variant: "link" }), "mt-2 p-0")}
                  >
                    Ver liga →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
