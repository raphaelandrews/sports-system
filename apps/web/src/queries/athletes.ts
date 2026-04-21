import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AthleteReportResponse, AthleteResponse } from "@/types/athletes";
import { queryKeys } from "@/queries/keys";

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

export const athleteListQueryOptions = (params?: {
  page?: number;
  per_page?: number;
}) =>
  queryOptions({
    queryKey: [...queryKeys.athletes.all(), params ?? {}],
    queryFn: () =>
      apiFetch<PaginatedResponse<AthleteResponse>>("/athletes", {
        params: { page: 1, per_page: 20, ...params },
      }),
    staleTime: 2 * 60 * 1000,
  });

export const athleteReportQueryOptions = (athleteId: number) =>
  queryOptions({
    queryKey: queryKeys.athletes.report(athleteId),
    queryFn: () =>
      apiFetch<AthleteReportResponse>(`/report/athlete/${athleteId}`),
    staleTime: 2 * 60 * 1000,
  });
