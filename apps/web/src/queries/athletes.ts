import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { AthleteReportResponse } from "@/types/athletes";
import { queryKeys } from "@/queries/keys";

export const athleteReportQueryOptions = (athleteId: number) =>
  queryOptions({
    queryKey: queryKeys.athletes.report(athleteId),
    queryFn: () =>
      apiFetch<AthleteReportResponse>(`/report/athlete/${athleteId}`),
    staleTime: 2 * 60 * 1000,
  });
