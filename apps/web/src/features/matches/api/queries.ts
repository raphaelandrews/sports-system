import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { MatchDetailResponse } from "@/types/events";

export const matchDetailQueryOptions = (matchId: number) =>
  queryOptions({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: () => apiFetch<MatchDetailResponse>(`/matches/${matchId}`),
    staleTime: 10 * 1000,
  });
