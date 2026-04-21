import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import type { MedalBoardEntry, RecordResponse } from "@/types/results";
import { queryKeys } from "@/queries/keys";

export const medalBoardQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.results.medalBoard(),
    queryFn: () => apiFetch<MedalBoardEntry[]>("/results/medal-board"),
    staleTime: 30 * 1000,
  });

export const recordsQueryOptions = () =>
  queryOptions({
    queryKey: ["results", "records"],
    queryFn: () => apiFetch<RecordResponse[]>("/results/records"),
    staleTime: 2 * 60 * 1000,
  });
