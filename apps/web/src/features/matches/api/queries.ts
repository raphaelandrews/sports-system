import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const matchDetailQueryOptions = (matchId: number) =>
  queryOptions({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: () =>
      unwrap(
        client.GET("/matches/{match_id}", {
          params: { path: { match_id: matchId } },
        }),
      ),
    staleTime: 10 * 1000,
  });
