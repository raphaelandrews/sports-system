import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { WeekReportResponse, WeekResponse } from "@/types/weeks";
import { queryKeys } from "@/queries/keys";

export const weekListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.weeks.all(),
    queryFn: () =>
      apiFetch<{ data: WeekResponse[] }>("/weeks", { params: { per_page: 100 } }),
    staleTime: 2 * 60 * 1000,
  });

export const weekReportQueryOptions = (weekId: number) =>
  queryOptions({
    queryKey: queryKeys.weeks.report(weekId),
    queryFn: () => apiFetch<WeekReportResponse>(`/report/week/${weekId}`),
    staleTime: 30 * 1000,
  });
