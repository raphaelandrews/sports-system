import { queryOptions } from "@tanstack/react-query"

import { apiFetch } from "@/lib/api"
import type { FinalReportResponse } from "@/types/reports"

export const finalReportQueryOptions = () =>
  queryOptions({
    queryKey: ["reports", "final"],
    queryFn: () => apiFetch<FinalReportResponse>("/report/final"),
    staleTime: 60_000,
  })
