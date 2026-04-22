import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { ActivityFeedItem } from "@/types/activity";

export const activityFeedQueryOptions = (limit = 30) =>
  queryOptions({
    queryKey: queryKeys.activities.feed(limit),
    queryFn: () => apiFetch<ActivityFeedItem[]>("/activities", { params: { limit } }),
    staleTime: 30 * 1000,
  });
