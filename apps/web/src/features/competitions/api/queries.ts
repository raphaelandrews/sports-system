import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type {
  CompetitionReportResponse,
  CompetitionResponse,
  GenerateSchedulePreviewResponse,
} from "@/types/competitions";
import { queryKeys } from "@/features/keys";

export const competitionListQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.all(leagueId),
    queryFn: () =>
      apiFetch<{ data: CompetitionResponse[] }>(`/leagues/${leagueId}/competitions`, {
        params: { per_page: 100 },
      }),
    staleTime: 2 * 60 * 1000,
  });

export const competitionReportQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.report(leagueId, competitionId),
    queryFn: () =>
      apiFetch<CompetitionReportResponse>(
        `/leagues/${leagueId}/report/competition/${competitionId}`,
      ),
    staleTime: 30 * 1000,
  });

export const competitionDetailQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.detail(leagueId, competitionId),
    queryFn: () =>
      apiFetch<CompetitionResponse>(`/leagues/${leagueId}/competitions/${competitionId}`),
    staleTime: 30 * 1000,
  });

export const competitionSchedulePreviewQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: [...queryKeys.competitions.detail(leagueId, competitionId), "schedule-preview"],
    queryFn: () =>
      apiFetch<GenerateSchedulePreviewResponse>(
        `/leagues/${leagueId}/competitions/${competitionId}/generate-schedule`,
        { method: "POST" },
      ),
    staleTime: 30 * 1000,
  });
