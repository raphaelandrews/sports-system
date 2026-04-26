import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { EnrollmentStatus } from "@/types/enrollments";

export const enrollmentListQueryOptions = (
  leagueId: number,
  params?: {
    page?: number;
    per_page?: number;
    event_id?: number;
    delegation_id?: number;
    status?: EnrollmentStatus;
  },
) =>
  queryOptions({
    queryKey: queryKeys.enrollments.list(leagueId, params),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/enrollments", {
          params: {
            path: { league_id: leagueId },
            query: { page: 1, per_page: 50, ...params },
          },
        }),
      ),
    staleTime: 60_000,
  });
