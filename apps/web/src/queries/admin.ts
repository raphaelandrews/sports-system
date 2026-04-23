import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { ChiefRequestResponse } from "@/types/auth";

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

export const adminRequestsQueryOptions = () =>
  queryOptions({
    queryKey: ["admin", "requests"],
    queryFn: () =>
      apiFetch<PaginatedResponse<ChiefRequestResponse>>("/admin/requests", {
        params: { per_page: 50 },
      }),
    staleTime: 60_000,
  });
