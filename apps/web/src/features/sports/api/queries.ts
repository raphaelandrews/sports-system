import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const sportListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.sports.all(),
    queryFn: () =>
      unwrap(
        client.GET("/sports", {
          params: { query: { per_page: 50 } },
        }),
      ),
    staleTime: 5 * 60 * 1000,
  });

export const sportDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.sports.detail(id),
    queryFn: () =>
      unwrap(
        client.GET("/sports/{sport_id}", {
          params: { path: { sport_id: id } },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });
