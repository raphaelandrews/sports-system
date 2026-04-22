import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { GlobalSearchResponse } from "@/types/search";

export const globalSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: queryKeys.search.global(query),
    queryFn: () =>
      apiFetch<GlobalSearchResponse>("/search/global", {
        params: { q: query, limit: 8 },
      }),
    staleTime: 30 * 1000,
  });
