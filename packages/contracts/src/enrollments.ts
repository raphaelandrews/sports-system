import { z } from "zod";

import { EnrollmentStatus } from "./enums.js";
export { EnrollmentStatus };

export const EnrollmentCreate = z
  .object({
    athlete_id: z.number(),
    event_id: z.number(),
    delegation_id: z.number(),
  })
  .strict();
export type EnrollmentCreate = z.infer<typeof EnrollmentCreate>;

export const EnrollmentReview = z
  .object({
    status: EnrollmentStatus,
    validation_message: z.string().optional(),
  })
  .strict();
export type EnrollmentReview = z.infer<typeof EnrollmentReview>;

export const EnrollmentResponse = z.object({
  id: z.number(),
  athlete_id: z.number(),
  event_id: z.number(),
  delegation_id: z.number(),
  status: EnrollmentStatus,
  validation_message: z.string().nullable(),
  created_at: z.string().datetime(),
});
export type EnrollmentResponse = z.infer<typeof EnrollmentResponse>;
