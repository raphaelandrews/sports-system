import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.auth.session(),
    queryFn: () => unwrap(client.GET("/users/me")),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
