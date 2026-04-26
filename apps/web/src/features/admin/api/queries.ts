import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const adminRequestsQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.admin.requests(leagueId),
    queryFn: () =>
      unwrap(
        client.GET("/admin/requests", {
          params: {
            query: { per_page: 50 },
          },
        }),
      ),
    staleTime: 60_000,
  });
