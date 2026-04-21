export type WeekStatus = "DRAFT" | "SCHEDULED" | "LOCKED" | "ACTIVE" | "COMPLETED";

export interface WeekResponse {
  id: number;
  week_number: number;
  start_date: string;
  end_date: string;
  status: WeekStatus;
  sport_focus: number[];
}

export interface WeekReportResponse {
  week_id: number;
  week_number: number;
  status: string;
  start_date: string;
  end_date: string;
  medal_board: import("./results").MedalBoardEntry[];
  summary: {
    total_events: number;
    total_matches: number;
    completed_matches: number;
  };
}
