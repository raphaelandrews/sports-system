import { z } from "zod";

export const Meta = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
});
export type Meta = z.infer<typeof Meta>;

export const ErrorResponse = z.object({
  error: z.string(),
  detail: z.string(),
  code: z.string(),
});
export type ErrorResponse = z.infer<typeof ErrorResponse>;
