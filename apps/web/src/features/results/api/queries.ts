import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type {
  MedalBoardEntry,
  RecordResponse,
  ResultResponse,
  SportStandingEntry,
} from "@/types/results";
import { queryKeys } from "@/features/keys";

export const medalBoardQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.results.medalBoard(leagueId),
    queryFn: () => apiFetch<MedalBoardEntry[]>(`/leagues/${leagueId}/results/medal-board`),
    staleTime: 30 * 1000,
  });

export const sportMedalBoardQueryOptions = (leagueId: number, sportId: number) =>
  queryOptions({
    queryKey: queryKeys.results.medalBoardSport(leagueId, sportId),
    queryFn: () =>
      apiFetch<MedalBoardEntry[]>(`/leagues/${leagueId}/results/medal-board/${sportId}`),
    staleTime: 30 * 1000,
  });

export const resultListQueryOptions = (
  leagueId: number,
  params?: {
    page?: number;
    per_page?: number;
    competition_id?: number;
    sport_id?: number;
    delegation_id?: number;
  },
) =>
  queryOptions({
    queryKey: queryKeys.results.list(leagueId, params),
    queryFn: () =>
      apiFetch<{ data: ResultResponse[]; meta: { total: number; page: number; per_page: number } }>(
        `/leagues/${leagueId}/results`,
        {
          params: { page: 1, per_page: 100, ...params },
        },
      ),
    staleTime: 60 * 1000,
  });

export const modalityStandingsQueryOptions = (leagueId: number, modalityId: number) =>
  queryOptions({
    queryKey: queryKeys.results.standings(leagueId, modalityId),
    queryFn: () =>
      apiFetch<SportStandingEntry[]>(`/leagues/${leagueId}/results/standings/${modalityId}`),
    staleTime: 30 * 1000,
  });

export const recordsQueryOptions = (leagueId: number, modalityId?: number) =>
  queryOptions({
    queryKey: queryKeys.results.records(leagueId, modalityId),
    queryFn: () =>
      apiFetch<RecordResponse[]>(`/leagues/${leagueId}/results/records`, {
        params: modalityId ? { modality_id: modalityId } : undefined,
      }),
    staleTime: 2 * 60 * 1000,
  });
