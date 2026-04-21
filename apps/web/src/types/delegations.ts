export interface DelegationResponse {
  id: number;
  code: string;
  name: string;
  flag_url: string | null;
  chief_id: number | null;
  is_active: boolean;
  created_at: string;
}

export type DelegationSummary = DelegationResponse

export type DelegationMemberRole = "CHIEF" | "ATHLETE" | "COACH";

export interface MemberInfo {
  id: number;
  user_id: number;
  user_name: string;
  role: DelegationMemberRole;
  joined_at: string;
  left_at: string | null;
}

export interface DelegationDetailResponse extends DelegationResponse {
  members: MemberInfo[];
}

export interface MemberHistoryItem {
  id: number;
  user_id: number;
  user_name: string;
  role: DelegationMemberRole;
  joined_at: string;
  left_at: string | null;
}

export interface DelegationCreateInput {
  name: string;
  code?: string;
  flag_url?: string;
}

export interface DelegationUpdateInput {
  name?: string;
  flag_url?: string;
}
