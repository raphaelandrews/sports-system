import type { ApiSchemas } from "@/types/api.gen";

export type EventPhase = ApiSchemas["EventPhase"];
export type EventStatus = ApiSchemas["EventStatus"];
export type MatchStatus = ApiSchemas["MatchStatus"];
export type ParticipantRole = ApiSchemas["ParticipantRole"];
export type MatchEventType = ApiSchemas["MatchEventType"];

export type EventCreate = Omit<ApiSchemas["EventCreate"], "week_id"> & {
  competition_id: number;
};
export type EventUpdate = ApiSchemas["EventUpdate"];
export type EventResponse = Omit<ApiSchemas["EventResponse"], "week_id"> & {
  competition_id: number;
};
export type EventDetailResponse = ApiSchemas["EventDetailResponse"];
export type MatchResponse = ApiSchemas["MatchResponse"];
export type MatchDetailResponse = ApiSchemas["MatchDetailResponse"];
export type MatchParticipantResponse = ApiSchemas["MatchParticipantResponse"];
export type MatchEventResponse = ApiSchemas["MatchEventResponse"];
export type MatchEventCreate = ApiSchemas["MatchEventCreate"];
