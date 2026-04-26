import { z } from "zod";

import { Gender, SportType } from "./enums.js";
export { Gender, SportType };

export const ModalityResponse = z.object({
  id: z.number(),
  sport_id: z.number(),
  name: z.string(),
  gender: Gender,
  category: z.string().nullable(),
  rules_json: z.record(z.string(), z.unknown()),
  is_active: z.boolean(),
});
export type ModalityResponse = z.infer<typeof ModalityResponse>;

export const SportResponse = z.object({
  id: z.number(),
  name: z.string(),
  sport_type: SportType,
  description: z.string().nullable(),
  rules_json: z.record(z.string(), z.unknown()),
  player_count: z.number().nullable(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
});
export type SportResponse = z.infer<typeof SportResponse>;

export const SportDetailResponse = SportResponse.extend({
  modalities: z.array(ModalityResponse),
  stats_schema: z.record(z.string(), z.unknown()).nullable().default(null),
});
export type SportDetailResponse = z.infer<typeof SportDetailResponse>;

export const SportCreate = z
  .object({
    name: z.string().min(1),
    sport_type: SportType,
    description: z.string().optional(),
    rules_json: z.record(z.string(), z.unknown()).default({}),
    player_count: z.number().nullable().optional(),
  })
  .strict();
export type SportCreate = z.infer<typeof SportCreate>;

export const SportUpdate = z
  .object({
    name: z.string().optional(),
    description: z.string().optional(),
    rules_json: z.record(z.string(), z.unknown()).optional(),
    player_count: z.number().nullable().optional(),
  })
  .strict();
export type SportUpdate = z.infer<typeof SportUpdate>;

export const ModalityCreate = z
  .object({
    name: z.string().min(1),
    gender: Gender,
    category: z.string().optional(),
    rules_json: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export type ModalityCreate = z.infer<typeof ModalityCreate>;

export const ModalityUpdate = z
  .object({
    name: z.string().optional(),
    gender: Gender.optional(),
    category: z.string().optional(),
    rules_json: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type ModalityUpdate = z.infer<typeof ModalityUpdate>;
