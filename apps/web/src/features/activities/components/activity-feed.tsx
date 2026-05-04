import { useEffect, useState } from "react";
import { Activity, Medal, RadioTower, TimerReset } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { buildApiUrl } from "@/shared/lib/url";
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
  leagueId,
}: {
  initialItems: ActivityFeedItem[];
  limit: number;
  live?: boolean;
  showMatchLink?: boolean;
  title?: string;
  leagueId?: number;
}) {
  const [items, setItems] = useState(initialItems.slice(0, limit));

  useEffect(() => {
    setItems(initialItems.slice(0, limit));
  }, [initialItems, limit]);

  useEffect(() => {
    if (!live || typeof window === "undefined") return;

    const path = leagueId != null
      ? `/leagues/${leagueId}/activities/stream`
      : "/activities/stream";
    const eventSource = new EventSource(buildApiUrl(path), { withCredentials: true });

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
  }, [limit, live, leagueId]);

  return (
    <>
      <div className="flex flex-col gap-4 mt-4 will-change-transform">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade registrada.
          </p>
        ) : (
          <>
            {items.map((item) => {
              const Icon = itemIcon(item.item_type);

              return (
                <div
                  key={item.id}
                  className="rounded-[20px] bg-card p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>
                        {item.title}
                      </span>
                    </div>

                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      <div>{formatTimestamp(item.created_at)}</div>
                      {showMatchLink && item.match_id != null && leagueId != null ? (
                        <Link
                          to="/leagues/$leagueId/matches/$matchId"
                          params={{ leagueId: String(leagueId), matchId: String(item.match_id) }}
                          className="mt-2 inline-block text-foreground underline-offset-4 hover:underline"
                        >
                          Ver partida
                        </Link>
                      ) : null}
                    </div>
                  </div>

                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
                      {item.competition_number != null ? (
                        <span>Competição {item.competition_number}</span>
                      ) : null}
                      {item.sport_name ? <span>{item.sport_name}</span> : null}
                      {item.modality_name ? <span>{item.modality_name}</span> : null}
                      {item.minute != null ? <span>{item.minute}min</span> : null}
                    </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
