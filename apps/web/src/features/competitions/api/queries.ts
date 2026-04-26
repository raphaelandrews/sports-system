import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const competitionListQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.all(leagueId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/competitions", {
          params: { path: { league_id: leagueId }, query: { per_page: 100 } },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });

export const competitionReportQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.report(leagueId, competitionId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/report/competition/{competition_id}", {
          params: { path: { league_id: leagueId, competition_id: competitionId } },
        }),
      ),
    staleTime: 30 * 1000,
  });

export const competitionDetailQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.competitions.detail(leagueId, competitionId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/competitions/{competition_id}", {
          params: { path: { league_id: leagueId, competition_id: competitionId } },
        }),
      ),
    staleTime: 30 * 1000,
  });

export const competitionSchedulePreviewQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: [...queryKeys.competitions.detail(leagueId, competitionId), "schedule-preview"],
    queryFn: () =>
      unwrap(
        client.POST("/leagues/{league_id}/competitions/{competition_id}/generate-schedule", {
          params: { path: { league_id: leagueId, competition_id: competitionId } },
        }),
      ),
    staleTime: 30 * 1000,
  });
