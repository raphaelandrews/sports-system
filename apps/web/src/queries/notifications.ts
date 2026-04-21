import { queryOptions } from "@tanstack/react-query";
import { ApiError, apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { NotificationResponse } from "@/types/notifications";
import type { ChiefRequestResponse } from "@/types/auth";

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; per_page: number };
}

export const notificationsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: () =>
      apiFetch<PaginatedResponse<NotificationResponse>>(
        `/users/${userId}/notifications`,
        { params: { per_page: "20" } },
      ),
    staleTime: 30_000,
  });

export const chiefRequestQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.requests.chief(),
    queryFn: () => apiFetch<ChiefRequestResponse>("/requests/chief/me"),
    staleTime: 60_000,
    retry: (_count, error) =>
      !(error instanceof ApiError && error.status === 404),
  });
