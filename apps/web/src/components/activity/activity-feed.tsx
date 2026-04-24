import { useEffect, useState } from "react";
import { Activity, Medal, RadioTower, TimerReset } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Badge } from "@sports-system/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@sports-system/ui/components/card";

import { buildApiUrl } from "@/lib/url";
import type { ActivityFeedItem, ActivityFeedItemType } from "@/types/activity";

function itemIcon(type: ActivityFeedItemType) {
  if (type === "MATCH_STARTED") return RadioTower;
  if (type === "MATCH_FINISHED") return TimerReset;
  if (type === "RECORD_SET") return Medal;
  return Activity;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function mergeItems(current: ActivityFeedItem[], incoming: ActivityFeedItem, limit: number) {
  const deduped = [incoming, ...current.filter((item) => item.id !== incoming.id)];
  deduped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return deduped.slice(0, limit);
}

export function ActivityFeed({
  initialItems,
  limit,
  live = true,
  showMatchLink = false,
  title = "Feed de atividades",
}: {
  initialItems: ActivityFeedItem[];
  limit: number;
  live?: boolean;
  showMatchLink?: boolean;
  title?: string;
}) {
  const [items, setItems] = useState(initialItems.slice(0, limit));

  useEffect(() => {
    setItems(initialItems.slice(0, limit));
  }, [initialItems, limit]);

  useEffect(() => {
    if (!live || typeof window === "undefined") return;

    const streamUrl = new URL(buildApiUrl("/activities/stream"));
    const eventSource = new EventSource(streamUrl.toString(), { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const item = JSON.parse(event.data) as ActivityFeedItem;
        if (!item?.id || !item?.created_at) return;
        setItems((current) => mergeItems(current, item, limit));
      } catch {
        // Ignore malformed stream frames.
      }
    };

    return () => {
      eventSource.close();
    };
  }, [limit, live]);

  return (
    <Card className="border-border/70 bg-card/85 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">{title}</CardTitle>
        {live ? <Badge variant="secondary">Ao vivo</Badge> : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade global registrada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const Icon = itemIcon(item.item_type);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/70 bg-background/80 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 rounded-full border border-border/70 p-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                        <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                          {item.competition_number != null ? <span>Competição {item.competition_number}</span> : null}
                          {item.sport_name ? <span>{item.sport_name}</span> : null}
                          {item.modality_name ? <span>{item.modality_name}</span> : null}
                          {item.minute != null ? <span>{item.minute}min</span> : null}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <div>{formatTimestamp(item.created_at)}</div>
                      {showMatchLink && item.match_id != null ? (
                        <Link
                          to="/matches/$matchId"
                          params={{ matchId: String(item.match_id) }}
                          className="mt-2 inline-block text-foreground underline-offset-4 hover:underline"
                        >
                          Ver partida
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
