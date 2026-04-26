import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/shared/lib/api";
import type { LeagueMemberResponse, LeagueResponse } from "@/types/leagues";
import { queryKeys } from "@/features/keys";

export const leagueListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.leagues.all(),
    queryFn: () => apiFetch<LeagueResponse[]>("/leagues"),
    staleTime: 2 * 60 * 1000,
  });

export const leagueDetailQueryOptions = (leagueId: number | string) =>
  queryOptions({
    queryKey: queryKeys.leagues.detail(Number(leagueId)),
    queryFn: () => apiFetch<LeagueResponse>(`/leagues/${leagueId}`),
    staleTime: 30 * 1000,
  });

export const myLeaguesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.leagues.my(),
    queryFn: () => apiFetch<LeagueResponse[]>("/leagues/my"),
    staleTime: 2 * 60 * 1000,
  });

export const myLeagueMembershipQueryOptions = (leagueId: number | string) =>
  queryOptions({
    queryKey: queryKeys.leagues.membership(Number(leagueId)),
    queryFn: () => apiFetch<LeagueMemberResponse>(`/leagues/${leagueId}/members/me`),
    staleTime: 5 * 60 * 1000,
  });

export const leagueMembersQueryOptions = (leagueId: number | string) =>
  queryOptions({
    queryKey: queryKeys.leagues.members(Number(leagueId)),
    queryFn: () => apiFetch<LeagueMemberResponse[]>(`/leagues/${leagueId}/members`),
    staleTime: 60 * 1000,
  });
