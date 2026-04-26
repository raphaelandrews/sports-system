import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const aiGenerationHistoryQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.ai.history(leagueId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/ai/generation-history", {
          params: { path: { league_id: leagueId } },
        }),
      ),
    staleTime: 30_000,
  });

export const narrativeTodayQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.ai.narrative(leagueId, "today"),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/narrative/today", {
          params: { path: { league_id: leagueId } },
        }),
      ),
    staleTime: 30_000,
  });

export const narrativeByDateQueryOptions = (leagueId: number, targetDate: string) =>
  queryOptions({
    queryKey: queryKeys.ai.narrative(leagueId, targetDate),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/narrative/{narrative_date}", {
          params: { path: { league_id: leagueId, narrative_date: targetDate } },
        }),
      ),
    staleTime: 30_000,
  });
