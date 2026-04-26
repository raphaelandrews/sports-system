import { z } from "zod";

import { EventPhase, EventStatus, MatchEventType, MatchStatus, ParticipantRole } from "./enums.js";
export { EventPhase, EventStatus, MatchEventType, MatchStatus, ParticipantRole };

export const EventCreate = z
  .object({
    competition_id: z.number(),
    modality_id: z.number(),
    event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
    venue: z.string().optional(),
    phase: EventPhase,
  })
  .strict();
export type EventCreate = z.infer<typeof EventCreate>;

export const EventUpdate = z
  .object({
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    start_time: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/)
      .optional(),
    venue: z.string().optional(),
    phase: EventPhase.optional(),
    status: EventStatus.optional(),
  })
  .strict();
export type EventUpdate = z.infer<typeof EventUpdate>;

export const EventResponse = z.object({
  id: z.number(),
  competition_id: z.number(),
  modality_id: z.number(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  venue: z.string().nullable(),
  phase: EventPhase,
  status: EventStatus,
});
export type EventResponse = z.infer<typeof EventResponse>;

export const MatchParticipantResponse = z.object({
  id: z.number(),
  match_id: z.number(),
  athlete_id: z.number(),
  delegation_id_at_time: z.number(),
  role: ParticipantRole,
});
export type MatchParticipantResponse = z.infer<typeof MatchParticipantResponse>;

export const MatchEventResponse = z.object({
  id: z.number(),
  match_id: z.number(),
  minute: z.number().nullable(),
  event_type: MatchEventType,
  athlete_id: z.number().nullable(),
  delegation_id_at_time: z.number().nullable(),
  value_json: z.record(z.string(), z.unknown()).nullable(),
  created_at: z.string().datetime(),
});
export type MatchEventResponse = z.infer<typeof MatchEventResponse>;

export const MatchResponse = z.object({
  id: z.number(),
  event_id: z.number(),
  team_a_delegation_id: z.number().nullable(),
  team_b_delegation_id: z.number().nullable(),
  athlete_a_id: z.number().nullable(),
  athlete_b_id: z.number().nullable(),
  score_a: z.number().nullable(),
  score_b: z.number().nullable(),
  winner_delegation_id: z.number().nullable(),
  winner_athlete_id: z.number().nullable(),
  status: MatchStatus,
  started_at: z.string().datetime().nullable(),
  ended_at: z.string().datetime().nullable(),
});
export type MatchResponse = z.infer<typeof MatchResponse>;

export const MatchDetailResponse = MatchResponse.extend({
  participants: z.array(MatchParticipantResponse).default([]),
  events: z.array(MatchEventResponse).default([]),
});
export type MatchDetailResponse = z.infer<typeof MatchDetailResponse>;

export const EventDetailResponse = EventResponse.extend({
  matches: z.array(MatchResponse).default([]),
});
export type EventDetailResponse = z.infer<typeof EventDetailResponse>;

export const MatchEventCreate = z
  .object({
    minute: z.number().nullable().optional(),
    event_type: MatchEventType,
    athlete_id: z.number().nullable().optional(),
    delegation_id_at_time: z.number().nullable().optional(),
    value_json: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();
export type MatchEventCreate = z.infer<typeof MatchEventCreate>;
