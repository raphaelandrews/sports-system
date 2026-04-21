import { queryOptions } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api"
import type { EnrollmentResponse, EnrollmentStatus } from "@/types/enrollments"

interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; per_page: number }
}

export const enrollmentListQueryOptions = (params?: {
  page?: number
  per_page?: number
  event_id?: number
  delegation_id?: number
  status?: EnrollmentStatus
}) =>
  queryOptions({
    queryKey: ["enrollments", params ?? {}],
    queryFn: () =>
      apiFetch<PaginatedResponse<EnrollmentResponse>>("/enrollments", {
        params: { page: 1, per_page: 50, ...params },
      }),
    staleTime: 60_000,
  })
