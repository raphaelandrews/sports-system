import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { ActivityFeedItem } from "@/types/activity";

export const activityFeedQueryOptions = (leagueId: number, limit = 30) =>
  queryOptions({
    queryKey: queryKeys.activities.feed(leagueId, limit),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/activities", {
          params: {
            path: { league_id: leagueId },
            query: { limit },
          },
        }),
      ),
    staleTime: 30 * 1000,
  });

export const globalActivityFeedQueryOptions = (limit = 30) =>
  queryOptions({
    queryKey: ["activities", "global", "feed", limit],
    queryFn: () =>
      unwrap(
        (client as any).GET("/activities", {
          params: { query: { limit } },
        }),
      ) as Promise<ActivityFeedItem[]>,
    staleTime: 30 * 1000,
  });
