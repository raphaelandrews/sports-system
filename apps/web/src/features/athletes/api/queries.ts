import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type { AthleteReportResponse, AthleteResponse } from "@/types/athletes";
import { queryKeys } from "@/features/keys";

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

export const athleteListQueryOptions = (
  leagueId: number,
  params?: {
    page?: number;
    per_page?: number;
  },
) =>
  queryOptions({
    queryKey: [...queryKeys.athletes.all(leagueId), params ?? {}],
    queryFn: () =>
      apiFetch<PaginatedResponse<AthleteResponse>>(`/leagues/${leagueId}/athletes`, {
        params: { page: 1, per_page: 20, ...params },
      }),
    staleTime: 2 * 60 * 1000,
  });

export const athleteReportQueryOptions = (leagueId: number, athleteId: number) =>
  queryOptions({
    queryKey: queryKeys.athletes.report(leagueId, athleteId),
    queryFn: () =>
      apiFetch<AthleteReportResponse>(`/leagues/${leagueId}/report/athlete/${athleteId}`),
    staleTime: 2 * 60 * 1000,
  });
