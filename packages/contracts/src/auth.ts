import { z } from "zod";

import { ChiefRequestStatus, UserRole } from "./enums.js";
export { ChiefRequestStatus, UserRole };

export const RegisterRequest = z
  .object({
    email: z
      .string()
      .min(1)
      .transform((v) => v.trim().toLowerCase())
      .refine((v) => v.includes("@") && v.split("@")[1]?.includes("."), {
        message: "Invalid email format",
      }),
    name: z
      .string()
      .min(1)
      .transform((v) => v.trim())
      .refine((v) => v.length > 0, { message: "Name cannot be empty" }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .refine((v) => /[A-Z]/.test(v), {
        message: "Password must contain at least one uppercase letter",
      })
      .refine((v) => /[^a-zA-Z0-9]/.test(v), {
        message: "Password must contain at least one symbol",
      }),
  })
  .strict();
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const LoginRequest = z
  .object({
    email: z
      .string()
      .min(1)
      .transform((v) => v.trim().toLowerCase()),
    password: z.string().min(1),
  })
  .strict();
export type LoginRequest = z.infer<typeof LoginRequest>;

export const TokenResponse = z
  .object({
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.string().default("bearer"),
  })
  .strict();
export type TokenResponse = z.infer<typeof TokenResponse>;

export const RefreshRequest = z
  .object({
    refresh_token: z.string(),
  })
  .strict();
export type RefreshRequest = z.infer<typeof RefreshRequest>;

export const OAuthFinalizeRequest = z
  .object({
    token: z.string(),
  })
  .strict();
export type OAuthFinalizeRequest = z.infer<typeof OAuthFinalizeRequest>;

export const UserResponse = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: UserRole,
  is_active: z.boolean(),
  created_at: z.string().datetime(),
});
export type UserResponse = z.infer<typeof UserResponse>;

export const UserSearchResponse = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
  role: UserRole,
  is_active: z.boolean(),
});
export type UserSearchResponse = z.infer<typeof UserSearchResponse>;

export const UserUpdate = z
  .object({
    name: z.string().optional(),
  })
  .strict();
export type UserUpdate = z.infer<typeof UserUpdate>;

export const ChiefRequestCreate = z
  .object({
    delegation_name: z.string().min(1),
    message: z.string().optional(),
  })
  .strict();
export type ChiefRequestCreate = z.infer<typeof ChiefRequestCreate>;

export const ChiefRequestResponse = z.object({
  id: z.number(),
  user_id: z.number(),
  delegation_name: z.string(),
  message: z.string().nullable(),
  status: ChiefRequestStatus,
  reviewed_by: z.number().nullable(),
  created_at: z.string().datetime(),
});
export type ChiefRequestResponse = z.infer<typeof ChiefRequestResponse>;

export const ChiefRequestReview = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});
export type ChiefRequestReview = z.infer<typeof ChiefRequestReview>;
