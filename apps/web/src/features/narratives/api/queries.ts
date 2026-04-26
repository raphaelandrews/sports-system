import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";
import type { AIGenerationResponse, NarrativeResponse } from "@/types/reports";

export const aiGenerationHistoryQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.ai.history(leagueId),
    queryFn: () => apiFetch<AIGenerationResponse[]>(`/leagues/${leagueId}/ai/generation-history`),
    staleTime: 30_000,
  });

export const narrativeTodayQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.ai.narrative(leagueId, "today"),
    queryFn: () => apiFetch<NarrativeResponse | null>(`/leagues/${leagueId}/narrative/today`),
    staleTime: 30_000,
  });

export const narrativeByDateQueryOptions = (leagueId: number, targetDate: string) =>
  queryOptions({
    queryKey: queryKeys.ai.narrative(leagueId, targetDate),
    queryFn: () => apiFetch<NarrativeResponse>(`/leagues/${leagueId}/narrative/${targetDate}`),
    staleTime: 30_000,
  });
