export interface DelegationSummary {
  id: number;
  name: string;
  code: string;
}

export interface DelegationResponse {
  id: number;
  code: string;
  name: string;
  flag_url: string | null;
  chief_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface MemberInfo {
  id: number;
  user_id: number;
  user_name: string;
  role: string;
  joined_at: string;
  left_at: string | null;
}

export interface DelegationDetailResponse extends DelegationResponse {
  members: MemberInfo[];
}
