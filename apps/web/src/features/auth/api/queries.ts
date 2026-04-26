import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type { Session } from "@/types/auth";
import { queryKeys } from "@/features/keys";

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.auth.session(),
    queryFn: () => apiFetch<Session>("/users/me"),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
