import { z } from "zod";

import { AthleteGender } from "./enums.js";
export { AthleteGender };

export const AthleteCreate = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    gender: AthleteGender.optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    user_id: z.number().optional(),
  })
  .strict();
export type AthleteCreate = z.infer<typeof AthleteCreate>;

export const AthleteUpdate = z
  .object({
    name: z.string().optional(),
    gender: AthleteGender.optional(),
    birthdate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    is_active: z.boolean().optional(),
  })
  .strict();
export type AthleteUpdate = z.infer<typeof AthleteUpdate>;

export const AthleteResponse = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  gender: AthleteGender.nullable(),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  is_active: z.boolean(),
  user_id: z.number().nullable(),
  created_at: z.string().datetime(),
});
export type AthleteResponse = z.infer<typeof AthleteResponse>;

export const DelegationHistoryItem = z.object({
  delegation_id: z.number(),
  delegation_name: z.string(),
  delegation_code: z.string(),
  role: z.string(),
  joined_at: z.string().datetime(),
  left_at: z.string().datetime().nullable(),
});
export type DelegationHistoryItem = z.infer<typeof DelegationHistoryItem>;

export const MatchHistoryItem = z.object({
  match_id: z.number(),
  event_id: z.number(),
  modality_name: z.string(),
  sport_name: z.string(),
  delegation_code: z.string(),
  role: z.string(),
  match_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});
export type MatchHistoryItem = z.infer<typeof MatchHistoryItem>;

export const AthleteHistoryResponse = z.object({
  delegation_history: z.array(DelegationHistoryItem),
  match_history: z.array(MatchHistoryItem),
});
export type AthleteHistoryResponse = z.infer<typeof AthleteHistoryResponse>;

export const AthleteStatisticsResponse = z.object({
  athlete_id: z.number(),
  total_matches: z.number(),
  modalities: z.array(z.string()),
  raw: z.array(z.record(z.string(), z.unknown())),
});
export type AthleteStatisticsResponse = z.infer<typeof AthleteStatisticsResponse>;
