import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type {
  CompetitionReportResponse,
  CompetitionResponse,
  GenerateSchedulePreviewResponse,
} from "@/types/competitions";
import { queryKeys } from "@/queries/keys";

export const competitionListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.competitions.all(),
    queryFn: () =>
      apiFetch<{ data: CompetitionResponse[] }>("/competitions", { params: { per_page: 100 } }),
    staleTime: 2 * 60 * 1000,
  });

export const competitionReportQueryOptions = (competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.report(competitionId),
    queryFn: () => apiFetch<CompetitionReportResponse>(`/report/competition/${competitionId}`),
    staleTime: 30 * 1000,
  });

export const competitionDetailQueryOptions = (competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.detail(competitionId),
    queryFn: () => apiFetch<CompetitionResponse>(`/competitions/${competitionId}`),
    staleTime: 30 * 1000,
  });

export const competitionSchedulePreviewQueryOptions = (competitionId: number) =>
  queryOptions({
    queryKey: [...queryKeys.competitions.detail(competitionId), "schedule-preview"],
    queryFn: () =>
      apiFetch<GenerateSchedulePreviewResponse>(
        `/competitions/${competitionId}/generate-schedule`,
        { method: "POST" },
    ),
    staleTime: 30 * 1000,
  });
