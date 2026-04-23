export type ActivityFeedItemType =
  | "MATCH_STARTED"
  | "MATCH_EVENT"
  | "MATCH_FINISHED"
  | "RECORD_SET";

export type ActivityFeedItem = {
  id: string;
  item_type: ActivityFeedItemType;
  created_at: string;
  title: string;
  description: string;
  match_id: number | null;
  event_id: number | null;
  week_id: number | null;
  week_number: number | null;
  sport_id: number | null;
  sport_name: string | null;
  modality_id: number | null;
  modality_name: string | null;
  event_date: string | null;
  start_time: string | null;
  athlete_id: number | null;
  athlete_name: string | null;
  delegation_id: number | null;
  delegation_name: string | null;
  minute: number | null;
};
