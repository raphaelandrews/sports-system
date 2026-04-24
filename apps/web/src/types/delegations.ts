import type { ApiSchemas } from "@/types/api.gen";
import type { Medal } from "@/types/athletes";

export type DelegationMemberRole = ApiSchemas["DelegationMemberRole"];
export type InviteStatus = ApiSchemas["InviteStatus"];

export type DelegationResponse = ApiSchemas["DelegationResponse"];
export type DelegationSummary = ApiSchemas["DelegationResponse"];
export type DelegationDetailResponse = ApiSchemas["DelegationDetailResponse"];
export type MemberInfo = ApiSchemas["MemberInfo"];
export type MemberHistoryItem = ApiSchemas["MemberHistoryItem"];
export type DelegationInviteResponse = ApiSchemas["InviteResponse"];
export type DelegationCreateInput = ApiSchemas["DelegationCreate"];
export type DelegationUpdateInput = ApiSchemas["DelegationUpdate"];
export type InviteCreate = ApiSchemas["InviteCreate"];

export interface DelegationAthleteStatisticsItem {
  athlete_id: number;
  athlete_name: string;
  athlete_code: string;
  is_active: boolean;
  is_current_member: boolean;
  joined_at: string | null;
  left_at: string | null;
  total_matches: number;
  gold: number;
  silver: number;
  bronze: number;
  total_medals: number;
}

export interface DelegationMedalItem {
  result_id: number;
  athlete_id: number | null;
  athlete_name: string | null;
  match_id: number;
  rank: number;
  medal: Medal;
}

export interface DelegationCompetitionPerformanceItem {
  competition_id: number;
  competition_number: number;
  status: string;
  start_date: string;
  end_date: string;
  matches_played: number;
  matches_completed: number;
  wins: number;
  gold: number;
  silver: number;
  bronze: number;
  total_medals: number;
}

export interface DelegationStatisticsResponse {
  delegation: DelegationResponse;
  athlete_count: number;
  active_athlete_count: number;
  total_matches: number;
  total_wins: number;
  gold: number;
  silver: number;
  bronze: number;
  total_medals: number;
  athletes: DelegationAthleteStatisticsItem[];
  medals: DelegationMedalItem[];
  weekly_performance: DelegationCompetitionPerformanceItem[];
}
