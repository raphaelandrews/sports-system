import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { MatchDetailResponse } from "@/types/events";

export const matchDetailQueryOptions = (matchId: number) =>
  queryOptions({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: () => apiFetch<MatchDetailResponse>(`/matches/${matchId}`),
    staleTime: 10 * 1000,
  });
