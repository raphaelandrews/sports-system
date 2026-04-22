export type SportType = "INDIVIDUAL" | "TEAM";
export type Gender = "M" | "F" | "MIXED";

export interface SportResponse {
  id: number;
  name: string;
  sport_type: SportType;
  description: string | null;
  rules_json: Record<string, unknown>;
  player_count: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ModalityResponse {
  id: number;
  sport_id: number;
  name: string;
  gender: Gender;
  category: string | null;
  rules_json: Record<string, unknown>;
  is_active: boolean;
}

export interface SportDetailResponse extends SportResponse {
  modalities: ModalityResponse[];
  stats_schema: Record<string, unknown> | null;
}
