import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

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
