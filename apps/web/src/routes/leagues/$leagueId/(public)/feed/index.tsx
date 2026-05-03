import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sports-system/ui/components/card";
import { Badge } from "@sports-system/ui/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@sports-system/ui/components/avatar";
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
} from "@sports-system/ui/components/reui/timeline";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Medal, RadioTower, TimerReset } from "lucide-react";

import { activityFeedQueryOptions } from "@/features/activities/api/queries";
import type { ActivityFeedItem, ActivityFeedItemType } from "@/types/activity";

export const Route = createFileRoute("/leagues/$leagueId/(public)/feed/")({
  loader: ({ context: { queryClient }, params: { leagueId } }) =>
    queryClient.ensureQueryData(activityFeedQueryOptions(Number(leagueId), 40)),
  component: FeedPage,
});

function itemIcon(type: ActivityFeedItemType) {
  if (type === "MATCH_STARTED") return RadioTower;
  if (type === "MATCH_FINISHED") return TimerReset;
  if (type === "RECORD_SET") return Medal;
  return Activity;
}

function itemBadge(type: ActivityFeedItemType) {
  switch (type) {
    case "MATCH_STARTED":
      return { label: "Iniciada", variant: "default" as const };
    case "MATCH_FINISHED":
      return { label: "Encerrada", variant: "secondary" as const };
    case "MATCH_EVENT":
      return { label: "Evento", variant: "outline" as const };
    case "RECORD_SET":
      return { label: "Recorde", variant: "destructive" as const };
    default:
      return { label: "Atividade", variant: "outline" as const };
  }
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function FeedPage() {
  const { leagueId } = Route.useParams();
  const numericLeagueId = Number(leagueId);
  const { data } = useSuspenseQuery(activityFeedQueryOptions(numericLeagueId, 40));

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

      <Card className="border border-border/70">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-xl">Linha do tempo</CardTitle>
          <Badge variant="secondary">Ao vivo</Badge>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade global registrada ainda.
            </p>
          ) : (
            <Timeline defaultValue={data.length}>
              {data.map((item: ActivityFeedItem, index: number) => {
                const Icon = itemIcon(item.item_type);
                const badge = itemBadge(item.item_type);

                return (
                  <TimelineItem
                    key={item.id}
                    step={index + 1}
                    className="group-data-[orientation=vertical]/timeline:ms-10"
                  >
                    <TimelineHeader>
                      <TimelineSeparator className="bg-input! group-data-[orientation=vertical]/timeline:top-2 group-data-[orientation=vertical]/timeline:-left-8 group-data-[orientation=vertical]/timeline:h-[calc(100%-2.5rem)] group-data-[orientation=vertical]/timeline:translate-y-7" />
                      <TimelineIndicator className="size-8 overflow-hidden rounded-full border-none group-data-[orientation=vertical]/timeline:-left-8">
                        <Avatar className="size-8">
                          <AvatarImage src={item.delegation_name ? undefined : ""} alt={item.delegation_name ?? item.sport_name ?? "Activity"} />
                          <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                            <Icon className="size-3.5" />
                          </AvatarFallback>
                        </Avatar>
                      </TimelineIndicator>
                    </TimelineHeader>
                    <TimelineContent>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.title}</span>
                            <Badge variant={badge.variant} className="text-[10px]">
                              {badge.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {item.competition_number != null ? (
                              <span>Competição {item.competition_number}</span>
                            ) : null}
                            {item.sport_name ? <span>{item.sport_name}</span> : null}
                            {item.modality_name ? <span>{item.modality_name}</span> : null}
                            {item.delegation_name ? <span>{item.delegation_name}</span> : null}
                            {item.minute != null ? <span>{item.minute}min</span> : null}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <TimelineDate className="mt-0.5 mb-0">
                            {formatTimestamp(item.created_at)}
                          </TimelineDate>
                          {item.match_id != null ? (
                            <Link
                              to="/leagues/$leagueId/matches/$matchId"
                              params={{ leagueId: String(numericLeagueId), matchId: String(item.match_id) }}
                              className="mt-1 block text-xs text-primary hover:underline"
                            >
                              Ver partida
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
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
