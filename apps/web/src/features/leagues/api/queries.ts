import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const leagueListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.leagues.all(),
    queryFn: () => unwrap(client.GET("/leagues")),
    staleTime: 2 * 60 * 1000,
  });

export const leagueDetailQueryOptions = (leagueId: number | string) =>
  queryOptions({
    queryKey: queryKeys.leagues.detail(Number(leagueId)),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}", { params: { path: { league_id: Number(leagueId) } } }),
      ),
    staleTime: 30 * 1000,
  });

export const myLeaguesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.leagues.my(),
    queryFn: () => unwrap(client.GET("/leagues/my")),
    staleTime: 2 * 60 * 1000,
  });

export const myLeagueMembershipQueryOptions = (leagueId: number | string) =>
  queryOptions({
    queryKey: queryKeys.leagues.membership(Number(leagueId)),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/members/me", {
          params: { path: { league_id: Number(leagueId) } },
        }),
      ),
    staleTime: 5 * 60 * 1000,
  });

export const leagueMembersQueryOptions = (leagueId: number | string) =>
  queryOptions({
    queryKey: queryKeys.leagues.members(Number(leagueId)),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/members", {
          params: { path: { league_id: Number(leagueId) } },
        }),
      ),
    staleTime: 60 * 1000,
  });
