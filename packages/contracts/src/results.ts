import { z } from "zod";

import { Medal } from "./enums.js";
export { Medal };

export const ResultCreate = z
  .object({
    match_id: z.number(),
    delegation_id: z.number().optional(),
    athlete_id: z.number().optional(),
    rank: z.number(),
    medal: Medal.optional(),
    value_json: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type ResultCreate = z.infer<typeof ResultCreate>;

export const ResultUpdate = z
  .object({
    rank: z.number().optional(),
    medal: Medal.optional(),
    value_json: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type ResultUpdate = z.infer<typeof ResultUpdate>;

export const ResultResponse = z.object({
  id: z.number(),
  match_id: z.number(),
  delegation_id: z.number().nullable(),
  athlete_id: z.number().nullable(),
  rank: z.number(),
  medal: Medal.nullable(),
  value_json: z.record(z.string(), z.unknown()).nullable(),
});
export type ResultResponse = z.infer<typeof ResultResponse>;

export const MedalBoardEntry = z.object({
  delegation_id: z.number(),
  delegation_name: z.string(),
  delegation_code: z.string(),
  gold: z.number(),
  silver: z.number(),
  bronze: z.number(),
  total: z.number(),
});
export type MedalBoardEntry = z.infer<typeof MedalBoardEntry>;

export const SportStandingEntry = z.object({
  rank: z.number(),
  delegation_id: z.number().nullable().optional(),
  delegation_name: z.string().nullable().optional(),
  athlete_id: z.number().nullable().optional(),
  athlete_name: z.string().nullable().optional(),
  medal: Medal.nullable().optional(),
  value_json: z.record(z.string(), z.unknown()).nullable().optional(),
});
export type SportStandingEntry = z.infer<typeof SportStandingEntry>;

export const RecordResponse = z.object({
  id: z.number(),
  modality_id: z.number(),
  modality_name: z.string(),
  athlete_id: z.number(),
  athlete_name: z.string(),
  delegation_name: z.string(),
  value: z.string(),
  competition_id: z.number(),
  set_at: z.string().datetime(),
});
export type RecordResponse = z.infer<typeof RecordResponse>;
