import { z } from "zod";

import { ActivityFeedItemType } from "./enums.js";
export { ActivityFeedItemType };

export const ActivityFeedItem = z.object({
  id: z.string(),
  item_type: ActivityFeedItemType,
  created_at: z.string().datetime(),
  title: z.string(),
  description: z.string(),
  match_id: z.number().nullable().default(null),
  event_id: z.number().nullable().default(null),
  competition_id: z.number().nullable().default(null),
  competition_number: z.number().nullable().default(null),
  sport_id: z.number().nullable().default(null),
  sport_name: z.string().nullable().default(null),
  modality_id: z.number().nullable().default(null),
  modality_name: z.string().nullable().default(null),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .default(null),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/)
    .nullable()
    .default(null),
  athlete_id: z.number().nullable().default(null),
  athlete_name: z.string().nullable().default(null),
  delegation_id: z.number().nullable().default(null),
  delegation_name: z.string().nullable().default(null),
  minute: z.number().nullable().default(null),
});
export type ActivityFeedItem = z.infer<typeof ActivityFeedItem>;
