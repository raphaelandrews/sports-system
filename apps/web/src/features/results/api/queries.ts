import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const medalBoardQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.results.medalBoard(leagueId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/results/medal-board", {
          params: { path: { league_id: leagueId } },
        }),
      ),
    staleTime: 30 * 1000,
  });

export const sportMedalBoardQueryOptions = (leagueId: number, sportId: number) =>
  queryOptions({
    queryKey: queryKeys.results.medalBoardSport(leagueId, sportId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/results/medal-board/{sport_id}", {
          params: { path: { league_id: leagueId, sport_id: sportId } },
        }),
      ),
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
      unwrap(
        client.GET("/leagues/{league_id}/results", {
          params: {
            path: { league_id: leagueId },
            query: { page: 1, per_page: 100, ...params },
          },
        }),
      ),
    staleTime: 60 * 1000,
  });

export const modalityStandingsQueryOptions = (leagueId: number, modalityId: number) =>
  queryOptions({
    queryKey: queryKeys.results.standings(leagueId, modalityId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/results/standings/{modality_id}", {
          params: { path: { league_id: leagueId, modality_id: modalityId } },
        }),
      ),
    staleTime: 30 * 1000,
  });

export const recordsQueryOptions = (leagueId: number, modalityId?: number) =>
  queryOptions({
    queryKey: queryKeys.results.records(leagueId, modalityId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/results/records", {
          params: {
            path: { league_id: leagueId },
            query: modalityId ? { modality_id: modalityId } : undefined,
          },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });
