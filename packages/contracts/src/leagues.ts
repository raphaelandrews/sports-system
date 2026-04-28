import { z } from "zod";

import { LeagueMemberRole, LeagueStatus } from "./enums.js";
export { LeagueMemberRole, LeagueStatus };

export const LeagueCreate = z
  .object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    sports_config: z.array(z.number()).default([]),
    auto_simulate: z.boolean().default(false),
    transfer_window_enabled: z.boolean().default(false),
    timezone: z.string().default("America/Sao_Paulo"),
  })
  .strict();
export type LeagueCreate = z.infer<typeof LeagueCreate>;

export const LeagueUpdate = z
  .object({
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    sports_config: z.array(z.number()).optional(),
    auto_simulate: z.boolean().optional(),
    transfer_window_enabled: z.boolean().optional(),
    timezone: z.string().optional(),
    status: LeagueStatus.optional(),
  })
  .strict();
export type LeagueUpdate = z.infer<typeof LeagueUpdate>;

export const LeagueResponse = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_by_id: z.number(),
  sports_config: z.array(z.number()),
  auto_simulate: z.boolean(),
  transfer_window_enabled: z.boolean(),
  timezone: z.string(),
  status: LeagueStatus,
  created_at: z.string().datetime(),
  member_count: z.number().default(0),
});
export type LeagueResponse = z.infer<typeof LeagueResponse>;

export const LeagueMemberResponse = z.object({
  id: z.number(),
  league_id: z.number(),
  user_id: z.number(),
  role: LeagueMemberRole,
  joined_at: z.string().datetime(),
  left_at: z.string().datetime().nullable(),
});
export type LeagueMemberResponse = z.infer<typeof LeagueMemberResponse>;

export const LeagueMemberRoleUpdate = z
  .object({
    role: LeagueMemberRole,
  })
  .strict();
export type LeagueMemberRoleUpdate = z.infer<typeof LeagueMemberRoleUpdate>;
