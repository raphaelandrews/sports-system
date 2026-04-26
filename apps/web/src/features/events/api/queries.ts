import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const competitionEventsQueryOptions = (leagueId: number, competitionId: number) =>
  queryOptions({
    queryKey: queryKeys.events.byCompetition(leagueId, competitionId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/events", {
          params: {
            path: { league_id: leagueId },
            query: { competition_id: competitionId, per_page: 100 },
          },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });

export const eventDetailQueryOptions = (leagueId: number, eventId: number) =>
  queryOptions({
    queryKey: queryKeys.events.detail(leagueId, eventId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/events/{event_id}", {
          params: { path: { league_id: leagueId, event_id: eventId } },
        }),
      ),
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
      unwrap(
        client.GET("/leagues/{league_id}/events", {
          params: {
            path: { league_id: leagueId },
            query: { per_page: 20, ...params },
          },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });
