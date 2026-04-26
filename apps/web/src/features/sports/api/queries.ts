import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type { SportDetailResponse, SportResponse } from "@/types/sports";
import { queryKeys } from "@/features/keys";

export const sportListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.sports.all(),
    queryFn: () =>
      apiFetch<{ data: SportResponse[] }>("/sports", {
        params: { per_page: 50 },
      }),
    staleTime: 5 * 60 * 1000,
  });

export const sportDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.sports.detail(id),
    queryFn: () => apiFetch<SportDetailResponse>(`/sports/${id}`),
    staleTime: 2 * 60 * 1000,
  });
