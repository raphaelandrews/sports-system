import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type {
  DelegationInviteResponse,
  MemberHistoryItem,
  DelegationDetailResponse,
  DelegationStatisticsResponse,
  DelegationSummary,
} from "@/types/delegations";
import { queryKeys } from "@/features/keys";

export const delegationListQueryOptions = (leagueId: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.all(leagueId),
    queryFn: () =>
      apiFetch<{ data: DelegationSummary[] }>(`/leagues/${leagueId}/delegations`, {
        params: { per_page: 100 },
      }),
    staleTime: 5 * 60 * 1000,
  });

export const delegationDetailQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.detail(leagueId, id),
    queryFn: () => apiFetch<DelegationDetailResponse>(`/leagues/${leagueId}/delegations/${id}`),
    staleTime: 2 * 60 * 1000,
  });

export const delegationHistoryQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.history(leagueId, id),
    queryFn: () => apiFetch<MemberHistoryItem[]>(`/leagues/${leagueId}/delegations/${id}/history`),
    staleTime: 2 * 60 * 1000,
  });

export const delegationStatisticsQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.statistics(leagueId, id),
    queryFn: () =>
      apiFetch<DelegationStatisticsResponse>(`/leagues/${leagueId}/delegations/${id}/statistics`),
    staleTime: 2 * 60 * 1000,
  });

export const delegationInvitesQueryOptions = (leagueId: number, id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.invites(leagueId, id),
    queryFn: () =>
      apiFetch<DelegationInviteResponse[]>(`/leagues/${leagueId}/delegations/${id}/invites`),
    staleTime: 30 * 1000,
  });
