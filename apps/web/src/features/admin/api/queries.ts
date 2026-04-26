import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { ChiefRequestResponse } from "@/types/auth";

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

export const adminRequestsQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.admin.requests(leagueId),
    queryFn: () =>
      apiFetch<PaginatedResponse<ChiefRequestResponse>>(`/leagues/${leagueId}/admin/requests`, {
        params: { per_page: 50 },
      }),
    staleTime: 60_000,
  });
