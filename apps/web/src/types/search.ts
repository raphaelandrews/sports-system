import type { EventPhase, EventStatus } from "@/types/events";

export interface GlobalSearchAthleteItem {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface GlobalSearchDelegationItem {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface GlobalSearchEventItem {
  id: number;
  week_id: number;
  week_number: number;
  sport_name: string;
  modality_name: string;
  venue: string | null;
  event_date: string;
  start_time: string;
  phase: EventPhase;
  status: EventStatus;
}

export interface GlobalSearchResponse {
  query: string;
  athletes: GlobalSearchAthleteItem[];
  delegations: GlobalSearchDelegationItem[];
  events: GlobalSearchEventItem[];
}
