import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { FinalReportResponse } from "@/types/reports";

export const finalReportQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.reports.final(leagueId),
    queryFn: () => apiFetch<FinalReportResponse>(`/leagues/${leagueId}/report/final`),
    staleTime: 60_000,
  });
