import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { UserSearchResponse } from "@/types/users";

export const userSearchQueryOptions = (query: string) =>
  queryOptions({
    queryKey: queryKeys.users.search(query),
    queryFn: () =>
      apiFetch<UserSearchResponse[]>("/users/search", {
        params: { q: query, limit: 12 },
      }),
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000,
  });
