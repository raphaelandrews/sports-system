import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const athleteListQueryOptions = (
  leagueId: number,
  params?: {
    page?: number;
    per_page?: number;
  },
) =>
  queryOptions({
    queryKey: [...queryKeys.athletes.all(leagueId), params ?? {}],
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/athletes", {
          params: {
            path: { league_id: leagueId },
            query: { page: 1, per_page: 20, ...params },
          },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });

export const athleteReportQueryOptions = (leagueId: number, athleteId: number) =>
  queryOptions({
    queryKey: queryKeys.athletes.report(leagueId, athleteId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/report/athlete/{athlete_id}", {
          params: { path: { league_id: leagueId, athlete_id: athleteId } },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });
