export type EventPhase = "GROUPS" | "QUARTER" | "SEMI" | "FINAL" | "BRONZE";
export type EventStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface EventResponse {
  id: number;
  week_id: number;
  modality_id: number;
  event_date: string;
  start_time: string;
  venue: string | null;
  phase: EventPhase;
  status: EventStatus;
}

export interface MatchResponse {
  id: number;
  event_id: number;
  team_a_delegation_id: number | null;
  team_b_delegation_id: number | null;
  athlete_a_id: number | null;
  athlete_b_id: number | null;
  score_a: number | null;
  score_b: number | null;
  winner_delegation_id: number | null;
  status: MatchStatus;
}

export interface EventDetailResponse extends EventResponse {
  matches: MatchResponse[];
}
