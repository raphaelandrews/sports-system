import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/queries/keys";
import type { AIGenerationResponse, NarrativeResponse } from "@/types/reports";

export const aiGenerationHistoryQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.ai.history(),
    queryFn: () => apiFetch<AIGenerationResponse[]>("/ai/generation-history"),
    staleTime: 30_000,
  });

export const narrativeTodayQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.ai.narrative("today"),
    queryFn: () => apiFetch<NarrativeResponse | null>("/narrative/today"),
    staleTime: 30_000,
  });

export const narrativeByDateQueryOptions = (targetDate: string) =>
  queryOptions({
    queryKey: queryKeys.ai.narrative(targetDate),
    queryFn: () => apiFetch<NarrativeResponse>(`/narrative/${targetDate}`),
    staleTime: 30_000,
  });
