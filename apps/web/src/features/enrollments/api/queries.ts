import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { EnrollmentResponse, EnrollmentStatus } from "@/types/enrollments";

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

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
      apiFetch<PaginatedResponse<EnrollmentResponse>>(`/leagues/${leagueId}/enrollments`, {
        params: { page: 1, per_page: 50, ...params },
      }),
    staleTime: 60_000,
  });
