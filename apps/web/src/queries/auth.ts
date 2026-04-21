import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { Session } from "@/types/auth";
import { queryKeys } from "@/queries/keys";

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.auth.session(),
    queryFn: () => apiFetch<Session>("/users/me"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
