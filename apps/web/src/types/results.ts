export interface MedalBoardEntry {
  delegation_id: number;
  delegation_name: string;
  delegation_code: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export interface RecordResponse {
  id: number;
  modality_id: number;
  modality_name: string;
  athlete_id: number;
  athlete_name: string;
  delegation_name: string;
  value: string;
  week_id: number;
  set_at: string;
}

export interface SportStandingEntry {
  rank: number;
  delegation_id: number | null;
  delegation_name: string | null;
  athlete_id: number | null;
  athlete_name: string | null;
  medal: string | null;
  value_json: Record<string, unknown> | null;
}
