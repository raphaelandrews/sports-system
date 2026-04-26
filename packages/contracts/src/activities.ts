import { z } from "zod";

import { ActivityFeedItemType } from "./enums.js";
export { ActivityFeedItemType };

export const ActivityFeedItem = z.object({
  id: z.string(),
  item_type: ActivityFeedItemType,
  created_at: z.string().datetime(),
  title: z.string(),
  description: z.string(),
  match_id: z.number().nullable().optional(),
  event_id: z.number().nullable().optional(),
  competition_id: z.number().nullable().optional(),
  competition_number: z.number().nullable().optional(),
  sport_id: z.number().nullable().optional(),
  sport_name: z.string().nullable().optional(),
  modality_id: z.number().nullable().optional(),
  modality_name: z.string().nullable().optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .nullable()
    .optional(),
  athlete_id: z.number().nullable().optional(),
  athlete_name: z.string().nullable().optional(),
  delegation_id: z.number().nullable().optional(),
  delegation_name: z.string().nullable().optional(),
  minute: z.number().nullable().optional(),
});
export type ActivityFeedItem = z.infer<typeof ActivityFeedItem>;
