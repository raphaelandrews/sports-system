import { queryOptions } from "@tanstack/react-query";

import { ApiError, client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const notificationsQueryOptions = (userId: number) =>
  queryOptions({
    queryKey: queryKeys.notifications.list(userId),
    queryFn: () =>
      unwrap(
        client.GET("/users/{user_id}/notifications", {
          params: {
            path: { user_id: userId },
            query: { per_page: 20 },
          },
        }),
      ),
    staleTime: 30_000,
  });

export const chiefRequestQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.requests.chief(),
    queryFn: () => unwrap(client.GET("/requests/chief/me")),
    staleTime: 60_000,
    retry: (_count, error) => !(error instanceof ApiError && error.status === 404),
  });
