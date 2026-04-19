import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export interface DelegationSummary {
  id: number;
  name: string;
  code: string;
}

export const delegationListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.delegations.all(),
    queryFn: () =>
      apiFetch<{ data: DelegationSummary[] }>("/delegations", {
        params: { per_page: 200 },
      }),
    staleTime: 5 * 60 * 1000,
  });
