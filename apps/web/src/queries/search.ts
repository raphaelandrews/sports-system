import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { GlobalSearchResponse } from "@/types/search";

export const globalSearchQueryOptions = (query: string, leagueId?: number) =>
  queryOptions({
    queryKey: queryKeys.search.global(query, leagueId),
    queryFn: () =>
      apiFetch<GlobalSearchResponse>(
        leagueId ? `/leagues/${leagueId}/search/global` : "/search/global",
        {
          params: { q: query, limit: 8 },
        },
      ),
    staleTime: 30 * 1000,
  });
