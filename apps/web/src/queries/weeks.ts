import { queryOptions } from "@tanstack/react-query";

import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

export type WeekStatus = "DRAFT" | "SCHEDULED" | "LOCKED" | "ACTIVE" | "COMPLETED";

export interface WeekResponse {
  id: number;
  week_number: number;
  start_date: string;
  end_date: string;
  status: WeekStatus;
  sport_focus: number[];
}

export interface MedalBoardEntry {
  delegation_id: number;
  delegation_name: string;
  delegation_code: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export interface WeekReportResponse {
  week_id: number;
  week_number: number;
  status: string;
  start_date: string;
  end_date: string;
  medal_board: MedalBoardEntry[];
  summary: {
    total_events: number;
    total_matches: number;
    completed_matches: number;
  };
}

export const weekListQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.weeks.all(),
    queryFn: () =>
      apiFetch<{ data: WeekResponse[] }>("/weeks", { params: { per_page: 100 } }),
    staleTime: 2 * 60 * 1000,
  });

export const weekReportQueryOptions = (weekId: number) =>
  queryOptions({
    queryKey: queryKeys.weeks.report(weekId),
    queryFn: () => apiFetch<WeekReportResponse>(`/report/week/${weekId}`),
    staleTime: 30 * 1000,
  });
