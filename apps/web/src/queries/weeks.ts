import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type {
  GenerateSchedulePreviewResponse,
  WeekReportResponse,
  WeekResponse,
} from "@/types/weeks";
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

export const weekDetailQueryOptions = (weekId: number) =>
  queryOptions({
    queryKey: queryKeys.weeks.detail(weekId),
    queryFn: () => apiFetch<WeekResponse>(`/weeks/${weekId}`),
    staleTime: 30 * 1000,
  });

export const weekSchedulePreviewQueryOptions = (weekId: number) =>
  queryOptions({
    queryKey: [...queryKeys.weeks.detail(weekId), "schedule-preview"],
    queryFn: () =>
      apiFetch<GenerateSchedulePreviewResponse>(`/weeks/${weekId}/generate-schedule`, {
        method: "POST",
      }),
    staleTime: 30 * 1000,
  });
