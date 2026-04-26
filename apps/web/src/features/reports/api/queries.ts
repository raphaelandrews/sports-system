import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const finalReportQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.reports.final(leagueId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/report/final", {
          params: { path: { league_id: leagueId } },
        }),
      ),
    staleTime: 60_000,
  });
