import { useQueries, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Badge } from "@sports-system/ui/components/badge";
import { buttonVariants } from "@sports-system/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { cn } from "@sports-system/ui/lib/utils";
import {
  myLeagueMembershipQueryOptions,
  myLeaguesQueryOptions,
} from "@/features/leagues/api/queries";

export const Route = createFileRoute("/_authenticated/my-leagues/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(myLeaguesQueryOptions()),
  component: MyLeaguesPage,
});

const roleLabel: Record<string, string> = {
  LEAGUE_ADMIN: "Admin",
  CHIEF: "Chefe",
  COACH: "Técnico",
  ATHLETE: "Atleta",
};

function MyLeaguesPage() {
  const { data: leagues } = useSuspenseQuery(myLeaguesQueryOptions());

  const membershipQueries = useQueries({
    queries: leagues.map((league) => myLeagueMembershipQueryOptions(league.id)),
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Minhas ligas</h1>
        <Link to="/leagues/new" className={cn(buttonVariants())}>
          Criar liga
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league, index) => {
          const membership = membershipQueries[index]?.data;
          return (
            <Card key={league.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarImage src={league.logo_url ?? ""} alt={league.name} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {league.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <CardTitle>{league.name}</CardTitle>
                      {membership && (
                        <Badge variant="outline">{roleLabel[membership.role] ?? membership.role}</Badge>
                      )}
                    </div>
                    <CardDescription>{league.slug}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {league.description ?? "Sem descrição"}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{league.member_count} membros</span>
                  <span>·</span>
                  <span>{league.timezone}</span>
                </div>
                <Link
                  to="/leagues/$leagueId"
                  params={{ leagueId: String(league.id) }}
                  className={cn(buttonVariants({ variant: "secondary" }), "mt-4 w-full")}
                >
                  Ver liga
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {leagues.length === 0 && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Você ainda não participa de nenhuma liga.</p>
          <Link to="/leagues" className={cn(buttonVariants())}>
            Explorar ligas
          </Link>
        </div>
      )}
    </div>
  );
}
