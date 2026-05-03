import { z } from "zod";

export const UserRole = z.enum(["ADMIN", "SUPERADMIN", "USER", "CHIEF", "COACH", "ATHLETE"]);
export type UserRole = z.infer<typeof UserRole>;

export const NotificationType = z.enum([
  "INVITE",
  "REQUEST_REVIEWED",
  "MATCH_REMINDER",
  "RESULT",
  "TRANSFER",
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const ChiefRequestStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type ChiefRequestStatus = z.infer<typeof ChiefRequestStatus>;

export const LeagueStatus = z.enum(["ACTIVE", "ARCHIVED"]);
export type LeagueStatus = z.infer<typeof LeagueStatus>;

export const LeagueMemberRole = z.enum(["LEAGUE_ADMIN", "CHIEF", "COACH", "ATHLETE"]);
export type LeagueMemberRole = z.infer<typeof LeagueMemberRole>;

export const AthleteGender = z.enum(["M", "F"]);
export type AthleteGender = z.infer<typeof AthleteGender>;

export const CompetitionStatus = z.enum(["DRAFT", "SCHEDULED", "LOCKED", "ACTIVE", "COMPLETED"]);
export type CompetitionStatus = z.infer<typeof CompetitionStatus>;

export const DelegationMemberRole = z.enum(["CHIEF", "ATHLETE", "COACH"]);
export type DelegationMemberRole = z.infer<typeof DelegationMemberRole>;

export const InviteStatus = z.enum(["PENDING", "ACCEPTED", "REFUSED"]);
export type InviteStatus = z.infer<typeof InviteStatus>;

export const DelegationStatus = z.enum(["INDEPENDENT", "PENDING", "APPROVED", "REJECTED"]);
export type DelegationStatus = z.infer<typeof DelegationStatus>;

export const EnrollmentStatus = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatus>;

export const EventPhase = z.enum(["GROUPS", "QUARTER", "SEMI", "FINAL", "BRONZE"]);
export type EventPhase = z.infer<typeof EventPhase>;

export const EventStatus = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export type EventStatus = z.infer<typeof EventStatus>;

export const MatchStatus = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);
export type MatchStatus = z.infer<typeof MatchStatus>;

export const ParticipantRole = z.enum(["PLAYER", "CAPTAIN", "SUBSTITUTE"]);
export type ParticipantRole = z.infer<typeof ParticipantRole>;

export const MatchEventType = z.enum([
  "GOAL",
  "CARD_YELLOW",
  "CARD_RED",
  "POINT",
  "PENALTY",
  "SUBSTITUTION",
  "SET_END",
  "IPPON",
  "WAZA_ARI",
]);
export type MatchEventType = z.infer<typeof MatchEventType>;

export const SportType = z.enum(["INDIVIDUAL", "TEAM"]);
export type SportType = z.infer<typeof SportType>;

export const Gender = z.enum(["M", "F", "MIXED"]);
export type Gender = z.infer<typeof Gender>;

export const Medal = z.enum(["GOLD", "SILVER", "BRONZE"]);
export type Medal = z.infer<typeof Medal>;

export const ActivityFeedItemType = z.enum([
  "MATCH_STARTED",
  "MATCH_EVENT",
  "MATCH_FINISHED",
  "RECORD_SET",
]);
export type ActivityFeedItemType = z.infer<typeof ActivityFeedItemType>;
