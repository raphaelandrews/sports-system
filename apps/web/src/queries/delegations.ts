import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type {
  MemberHistoryItem,
  DelegationDetailResponse,
  DelegationSummary,
} from "@/types/delegations";
import { queryKeys } from "@/queries/keys";

export const delegationListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.delegations.all(),
    queryFn: () =>
      apiFetch<{ data: DelegationSummary[] }>("/delegations", {
        params: { per_page: 100 },
      }),
    staleTime: 5 * 60 * 1000,
  });

export const delegationDetailQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.detail(id),
    queryFn: () => apiFetch<DelegationDetailResponse>(`/delegations/${id}`),
    staleTime: 2 * 60 * 1000,
  });

export const delegationHistoryQueryOptions = (id: number) =>
  queryOptions({
    queryKey: queryKeys.delegations.history(id),
    queryFn: () => apiFetch<MemberHistoryItem[]>(`/delegations/${id}/history`),
    staleTime: 2 * 60 * 1000,
  });
