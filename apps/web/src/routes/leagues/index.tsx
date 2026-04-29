import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@sports-system/ui/components/empty";
import { cn } from "@sports-system/ui/lib/utils";
import { leagueListQueryOptions } from "@/features/leagues/api/queries";

export const Route = createFileRoute("/leagues/")({
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(leagueListQueryOptions()),
  component: LeaguesPage,
});

function LeaguesPage() {
  const { data: leagues } = useSuspenseQuery(leagueListQueryOptions());

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Ligas</h1>
        <Link to="/leagues/new" className={cn(buttonVariants())}>
          Criar liga
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leagues.map((league) => (
          <Card key={league.id} className="rounded-xl bg-surface-1 transition-colors ring-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarImage src={league.logo_url ?? ""} alt={league.name} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {league.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle>{league.name}</CardTitle>
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
                className={cn(buttonVariants({ variant: "default" }), "mt-4 w-full")}
              >
                Ver liga
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {leagues.length === 0 && (
        <Empty className="mt-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Nenhuma liga cadastrada</EmptyTitle>
            <EmptyDescription>Crie a primeira liga para começar.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link to="/leagues/new" className={cn(buttonVariants())}>
              Criar liga
            </Link>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
