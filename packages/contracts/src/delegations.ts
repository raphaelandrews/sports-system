import { z } from "zod";

import { DelegationMemberRole, DelegationStatus, InviteStatus, Medal } from "./enums.js";
export { DelegationMemberRole, DelegationStatus, InviteStatus, Medal };

export const DelegationCreate = z
  .object({
    name: z.string().min(1),
    code: z.string().optional(),
    flag_url: z.string().optional(),
  })
  .strict();
export type DelegationCreate = z.infer<typeof DelegationCreate>;

export const DelegationUpdate = z
  .object({
    name: z.string().optional(),
    flag_url: z.string().optional(),
  })
  .strict();
export type DelegationUpdate = z.infer<typeof DelegationUpdate>;

export const DelegationResponse = z.object({
  id: z.number(),
  league_id: z.number().nullable(),
  code: z.string(),
  name: z.string(),
  flag_url: z.string().nullable(),
  chief_id: z.number().nullable(),
  is_active: z.boolean(),
  status: DelegationStatus,
  created_at: z.string().datetime(),
});
export type DelegationResponse = z.infer<typeof DelegationResponse>;

export const MemberInfo = z.object({
  id: z.number(),
  user_id: z.number(),
  user_name: z.string(),
  role: DelegationMemberRole,
  joined_at: z.string().datetime(),
  left_at: z.string().datetime().nullable(),
});
export type MemberInfo = z.infer<typeof MemberInfo>;

export const DelegationDetailResponse = DelegationResponse.extend({
  members: z.array(MemberInfo),
});
export type DelegationDetailResponse = z.infer<typeof DelegationDetailResponse>;

export const MemberHistoryItem = z.object({
  id: z.number(),
  user_id: z.number(),
  user_name: z.string(),
  role: DelegationMemberRole,
  joined_at: z.string().datetime(),
  left_at: z.string().datetime().nullable(),
});
export type MemberHistoryItem = z.infer<typeof MemberHistoryItem>;

export const InviteCreate = z
  .object({
    user_id: z.number(),
  })
  .strict();
export type InviteCreate = z.infer<typeof InviteCreate>;

export const InviteResponse = z.object({
  id: z.number(),
  delegation_id: z.number(),
  user_id: z.number(),
  status: InviteStatus,
  created_at: z.string().datetime(),
});
export type InviteResponse = z.infer<typeof InviteResponse>;

export const DelegationAthleteStatisticsItem = z.object({
  athlete_id: z.number(),
  athlete_name: z.string(),
  athlete_code: z.string(),
  is_active: z.boolean(),
  is_current_member: z.boolean(),
  joined_at: z.string().datetime().nullable(),
  left_at: z.string().datetime().nullable(),
  total_matches: z.number(),
  gold: z.number(),
  silver: z.number(),
  bronze: z.number(),
  total_medals: z.number(),
});
export type DelegationAthleteStatisticsItem = z.infer<typeof DelegationAthleteStatisticsItem>;

export const DelegationMedalItem = z.object({
  result_id: z.number(),
  athlete_id: z.number().nullable(),
  athlete_name: z.string().nullable(),
  match_id: z.number(),
  rank: z.number(),
  medal: Medal,
});
export type DelegationMedalItem = z.infer<typeof DelegationMedalItem>;

export const DelegationWeekPerformanceItem = z.object({
  competition_id: z.number(),
  number: z.number(),
  status: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  matches_played: z.number(),
  matches_completed: z.number(),
  wins: z.number(),
  gold: z.number(),
  silver: z.number(),
  bronze: z.number(),
  total_medals: z.number(),
});
export type DelegationWeekPerformanceItem = z.infer<typeof DelegationWeekPerformanceItem>;

export const DelegationStatisticsResponse = z.object({
  delegation: DelegationResponse,
  athlete_count: z.number(),
  active_athlete_count: z.number(),
  total_matches: z.number(),
  total_wins: z.number(),
  gold: z.number(),
  silver: z.number(),
  bronze: z.number(),
  total_medals: z.number(),
  athletes: z.array(DelegationAthleteStatisticsItem),
  medals: z.array(DelegationMedalItem),
  weekly_performance: z.array(DelegationWeekPerformanceItem),
});
export type DelegationStatisticsResponse = z.infer<typeof DelegationStatisticsResponse>;
