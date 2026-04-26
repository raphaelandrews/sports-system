import { queryOptions } from "@tanstack/react-query";

import { client, unwrap } from "@/shared/lib/api";
import { queryKeys } from "@/features/keys";

export const delegationListQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.all(leagueId),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/delegations", {
          params: { path: { league_id: leagueId }, query: { per_page: 100 } },
        }),
      ),
    staleTime: 5 * 60 * 1000,
  });

export const delegationDetailQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.detail(leagueId, id),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/delegations/{delegation_id}", {
          params: { path: { league_id: leagueId, delegation_id: id } },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });

export const delegationHistoryQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.history(leagueId, id),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/delegations/{delegation_id}/history", {
          params: { path: { league_id: leagueId, delegation_id: id } },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });

export const delegationStatisticsQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.statistics(leagueId, id),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/delegations/{delegation_id}/statistics", {
          params: { path: { league_id: leagueId, delegation_id: id } },
        }),
      ),
    staleTime: 2 * 60 * 1000,
  });

export const delegationInvitesQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.invites(leagueId, id),
    queryFn: () =>
      unwrap(
        client.GET("/leagues/{league_id}/delegations/{delegation_id}/invites", {
          params: { path: { league_id: leagueId, delegation_id: id } },
        }),
      ),
    staleTime: 30 * 1000,
  });
