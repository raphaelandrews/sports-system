import type { ApiSchemas } from "@/types/api.gen";

export type NotificationType = ApiSchemas["NotificationType"];
export type NotificationResponse = ApiSchemas["NotificationResponse"];

export interface InvitePayload {
  delegation_id: number;
  delegation_name: string;
  invite_id: number;
}

export interface RequestReviewedPayload {
  status: "APPROVED" | "REJECTED";
  delegation_name: string;
}

export interface MatchReminderPayload {
  match_id: number;
  event_name: string;
  start_time: string;
}

export interface ResultPayload {
  match_id: number;
  event_name: string;
}

export interface TransferPayload {
  status: string;
  delegation_name: string;
}
