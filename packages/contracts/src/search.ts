import { z } from "zod";

import { EventPhase, EventStatus } from "./enums.js";

export const GlobalSearchAthleteItem = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  is_active: z.boolean(),
});
export type GlobalSearchAthleteItem = z.infer<typeof GlobalSearchAthleteItem>;

export const GlobalSearchDelegationItem = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  is_active: z.boolean(),
});
export type GlobalSearchDelegationItem = z.infer<typeof GlobalSearchDelegationItem>;

export const GlobalSearchEventItem = z.object({
  id: z.number(),
  competition_id: z.number(),
  number: z.number(),
  sport_name: z.string(),
  modality_name: z.string(),
  venue: z.string().nullable(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  phase: EventPhase,
  status: EventStatus,
});
export type GlobalSearchEventItem = z.infer<typeof GlobalSearchEventItem>;

export const GlobalSearchResponse = z.object({
  query: z.string(),
  athletes: z.array(GlobalSearchAthleteItem),
  delegations: z.array(GlobalSearchDelegationItem),
  events: z.array(GlobalSearchEventItem),
});
export type GlobalSearchResponse = z.infer<typeof GlobalSearchResponse>;
