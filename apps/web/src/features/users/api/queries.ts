import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const userSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: queryKeys.users.search(query),
    queryFn: () =>
      unwrap(
        client.GET("/users/search", {
          params: { query: { q: query, limit: 12 } },
        }),
      ),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
