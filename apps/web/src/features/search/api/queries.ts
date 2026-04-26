import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const globalSearchQueryOptions = (query: string, leagueId?: number) =>
  queryOptions({
    queryKey: queryKeys.search.global(query, leagueId),
    queryFn: () => {
      if (!leagueId) throw new Error("leagueId is required");
      return unwrap(
        client.GET("/leagues/{league_id}/search/global", {
          params: {
            path: { league_id: leagueId },
            query: { q: query, limit: 8 },
          },
        }),
      );
    },
    staleTime: 30 * 1000,
  });
