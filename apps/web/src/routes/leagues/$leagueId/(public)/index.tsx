import { Badge } from "@sports-system/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@sports-system/ui/components/avatar";
import { Card, CardDescription, CardHeader, CardTitle } from "@sports-system/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Trophy,
  Calendar,
  Users,
  Dumbbell,
  BarChart3,
  Newspaper,
  ClipboardList,
} from "lucide-react";

import { leagueDetailQueryOptions } from "@/features/leagues/api/queries";

export const Route = createFileRoute("/leagues/$leagueId/(public)/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(leagueDetailQueryOptions(leagueId)),
  component: LeaguePublicPage,
});

function LeaguePublicPage() {
  const { leagueId } = Route.useParams();
  const { data: league } = useSuspenseQuery(leagueDetailQueryOptions(leagueId));

  const navItems = [
    {
      to: "/leagues/$leagueId/results" as const,
      label: "Resultados",
      desc: "Quadro de medalhas e rankings",
      icon: Trophy,
    },
    {
      to: "/leagues/$leagueId/calendar" as const,
      label: "Calendário",
      desc: "Agenda de eventos e competições",
      icon: Calendar,
    },
    {
      to: "/leagues/$leagueId/delegations" as const,
      label: "Delegações",
      desc: "Delegações participantes",
      icon: Users,
    },
    {
      to: "/leagues/$leagueId/sports" as const,
      label: "Esportes",
      desc: "Modalidades e chaveamentos",
      icon: Dumbbell,
    },
    {
      to: "/leagues/$leagueId/competitions" as const,
      label: "Competições",
      desc: "Resumo por competição",
      icon: ClipboardList,
    },
    {
      to: "/leagues/$leagueId/feed" as const,
      label: "Feed",
      desc: "Atividades recentes",
      icon: Newspaper,
    },
    {
      to: "/leagues/$leagueId/report" as const,
      label: "Relatório",
      desc: "Relatório final consolidado",
      icon: BarChart3,
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {league.status === "ACTIVE" ? (
            <Badge variant="secondary">Ativa</Badge>
          ) : (
            <Badge variant="destructive">Inativa</Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 rounded-xl">
            <AvatarImage src={league.logo_url ?? ""} alt={league.name} />
            <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-xl">
              {league.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{league.name}</h1>
            <p className="text-muted-foreground mt-1 text-lg">{league.slug}</p>
          </div>
        </div>
        {league.description && (
          <p className="mt-4 max-w-3xl text-muted-foreground">{league.description}</p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} params={{ leagueId }} className="block">
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{item.label}</CardTitle>
                      <CardDescription className="text-sm">{item.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
