export type LeagueStatus = "ACTIVE" | "ARCHIVED";

export type LeagueMemberRole = "LEAGUE_ADMIN" | "CHIEF" | "COACH" | "ATHLETE";

export type LeagueResponse = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_by_id: number;
  sports_config: number[];
  is_showcase: boolean;
  auto_simulate: boolean;
  transfer_window_enabled: boolean;
  timezone: string;
  status: LeagueStatus;
  created_at: string;
  member_count: number;
};

export type LeagueMemberResponse = {
  id: number;
  league_id: number;
  user_id: number;
  role: LeagueMemberRole;
  joined_at: string;
  left_at: string | null;
};

export type LeagueCreate = {
  name: string;
  slug: string;
  description?: string;
  sports_config: number[];
  auto_simulate: boolean;
  transfer_window_enabled: boolean;
  timezone: string;
};
