import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type { EventDetailResponse, EventResponse } from "@/types/events";
import { queryKeys } from "@/features/keys";

export const competitionEventsQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.events.byCompetition(leagueId, competitionId),
    queryFn: () =>
      apiFetch<{ data: EventResponse[] }>(`/leagues/${leagueId}/events`, {
        params: { competition_id: competitionId, per_page: 100 },
      }),
    staleTime: 2 * 60 * 1000,
  });

export const eventDetailQueryOptions = (leagueId: number, eventId: number) =>
  queryOptions({
    queryKey: queryKeys.events.detail(leagueId, eventId),
    queryFn: () => apiFetch<EventDetailResponse>(`/leagues/${leagueId}/events/${eventId}`),
    staleTime: 2 * 60 * 1000,
  });

export const allEventsQueryOptions = (
  leagueId: number,
  params?: {
    per_page?: number;
    page?: number;
    competition_id?: number;
    sport_id?: number;
    event_date?: string;
  },
) =>
  queryOptions({
    queryKey: [...queryKeys.events.all(leagueId), params ?? {}],
    queryFn: () =>
      apiFetch<{ data: EventResponse[]; meta: { total: number } }>(`/leagues/${leagueId}/events`, {
        params: { per_page: 20, ...params },
      }),
    staleTime: 2 * 60 * 1000,
  });
