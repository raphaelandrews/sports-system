import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { EventDetailResponse, EventResponse } from "@/types/events";
import { queryKeys } from "@/queries/keys";

export const weekEventsQueryOptions = (weekId: number) =>
  queryOptions({
    queryKey: queryKeys.events.byWeek(weekId),
    queryFn: () =>
      apiFetch<{ data: EventResponse[] }>("/events", {
        params: { week_id: weekId, per_page: 100 },
      }),
    staleTime: 2 * 60 * 1000,
  });

export const eventDetailQueryOptions = (eventId: number) =>
  queryOptions({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: () => apiFetch<EventDetailResponse>(`/events/${eventId}`),
    staleTime: 2 * 60 * 1000,
  });

export const allEventsQueryOptions = (params?: {
  per_page?: number;
  page?: number;
  week_id?: number;
  sport_id?: number;
  event_date?: string;
}) =>
  queryOptions({
    queryKey: [...queryKeys.events.all(), params ?? {}],
    queryFn: () =>
      apiFetch<{ data: EventResponse[]; meta: { total: number } }>("/events", {
        params: { per_page: 20, ...params },
      }),
    staleTime: 2 * 60 * 1000,
  });
