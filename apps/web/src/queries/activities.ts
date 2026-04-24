import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { ActivityFeedItem } from "@/types/activity";

export const activityFeedQueryOptions = (leagueId?: number, limit = 30) =>
  queryOptions({
    queryKey: queryKeys.activities.feed(leagueId, limit),
    queryFn: () =>
      apiFetch<ActivityFeedItem[]>(leagueId ? `/leagues/${leagueId}/activities` : "/activities", {
        params: { limit },
      }),
    staleTime: 30 * 1000,
  });
