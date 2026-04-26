import { z } from "zod";

import { CompetitionStatus } from "./enums.js";
export { CompetitionStatus };

export const CompetitionCreate = z
  .object({
    number: z.number().int(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sport_focus: z.array(z.number()).default([]),
  })
  .strict()
  .refine((data) => data.end_date >= data.start_date, {
    message: "end_date must be >= start_date",
    path: ["end_date"],
  });
export type CompetitionCreate = z.infer<typeof CompetitionCreate>;

export const CompetitionUpdate = z
  .object({
    number: z.number().int().optional(),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    sport_focus: z.array(z.number()).optional(),
  })
  .strict();
export type CompetitionUpdate = z.infer<typeof CompetitionUpdate>;

export const CompetitionResponse = z.object({
  id: z.number(),
  number: z.number().int(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: CompetitionStatus,
  sport_focus: z.array(z.unknown()),
});
export type CompetitionResponse = z.infer<typeof CompetitionResponse>;

export const SchedulePreviewMatch = z.object({
  modality_id: z.number(),
  modality_name: z.string(),
  team_a: z.string(),
  team_b: z.string(),
});
export type SchedulePreviewMatch = z.infer<typeof SchedulePreviewMatch>;

export const GenerateSchedulePreview = z.object({
  competition_id: z.number(),
  matches: z.array(SchedulePreviewMatch),
});
export type GenerateSchedulePreview = z.infer<typeof GenerateSchedulePreview>;
