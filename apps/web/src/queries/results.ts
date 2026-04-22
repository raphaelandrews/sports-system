import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type {
  MedalBoardEntry,
  RecordResponse,
  ResultResponse,
  SportStandingEntry,
} from "@/types/results";
import { queryKeys } from "@/queries/keys";

export const medalBoardQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.results.medalBoard(),
    queryFn: () => apiFetch<MedalBoardEntry[]>("/results/medal-board"),
    staleTime: 30 * 1000,
  });

export const sportMedalBoardQueryOptions = (sportId: number) =>
  queryOptions({
    queryKey: queryKeys.results.medalBoardSport(sportId),
    queryFn: () => apiFetch<MedalBoardEntry[]>(`/results/medal-board/${sportId}`),
    staleTime: 30 * 1000,
  });

export const resultListQueryOptions = (params?: {
  page?: number;
  per_page?: number;
  week_id?: number;
  sport_id?: number;
  delegation_id?: number;
}) =>
  queryOptions({
    queryKey: queryKeys.results.list(params),
    queryFn: () =>
      apiFetch<{ data: ResultResponse[]; meta: { total: number; page: number; per_page: number } }>(
        "/results",
        {
          params: { page: 1, per_page: 100, ...params },
        },
      ),
    staleTime: 60 * 1000,
  });

export const modalityStandingsQueryOptions = (modalityId: number) =>
  queryOptions({
    queryKey: queryKeys.results.standings(modalityId),
    queryFn: () => apiFetch<SportStandingEntry[]>(`/results/standings/${modalityId}`),
    staleTime: 30 * 1000,
  });

export const recordsQueryOptions = (modalityId?: number) =>
  queryOptions({
    queryKey: queryKeys.results.records(modalityId),
    queryFn: () =>
      apiFetch<RecordResponse[]>("/results/records", {
        params: modalityId ? { modality_id: modalityId } : undefined,
      }),
    staleTime: 2 * 60 * 1000,
  });
