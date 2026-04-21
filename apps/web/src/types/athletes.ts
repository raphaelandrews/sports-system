export type Medal = "GOLD" | "SILVER" | "BRONZE";

export interface AthleteResponse {
  id: number;
  name: string;
  code: string;
  gender: "M" | "F" | null;
  birthdate: string | null;
  is_active: boolean;
  user_id: number | null;
}

export interface DelegationHistoryItem {
  delegation_id: number;
  delegation_name: string;
  delegation_code: string;
  role: string;
  joined_at: string;
  left_at: string | null;
}

export interface MatchHistoryItem {
  match_id: number;
  event_id: number;
  modality_name: string;
  sport_name: string;
  delegation_code: string;
  role: string;
  match_date: string | null;
}

export interface MedalResult {
  id: number;
  match_id: number;
  rank: number;
  medal: Medal | null;
}

export interface AthleteReportResponse {
  athlete: AthleteResponse;
  delegation_history: DelegationHistoryItem[];
  match_history: MatchHistoryItem[];
  medals: MedalResult[];
  statistics: Record<string, Record<string, unknown>>;
}
