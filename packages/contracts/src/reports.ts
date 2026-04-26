import { z } from "zod";

import { AthleteResponse, DelegationHistoryItem, MatchHistoryItem } from "./athletes.js";
import { MedalBoardEntry, RecordResponse, ResultResponse } from "./results.js";

export const CompetitionSummary = z.object({
  total_delegations: z.number(),
  total_athletes: z.number(),
  total_competitions: z.number(),
  total_events: z.number(),
  total_matches: z.number(),
  completed_matches: z.number(),
});
export type CompetitionSummary = z.infer<typeof CompetitionSummary>;

export const AthleteBySportEntry = z.object({
  sport_id: z.number(),
  sport_name: z.string(),
  athlete_count: z.number(),
});
export type AthleteBySportEntry = z.infer<typeof AthleteBySportEntry>;

export const FinalReportResponse = z.object({
  medal_board: z.array(MedalBoardEntry),
  records: z.array(RecordResponse),
  summary: CompetitionSummary,
  athletes_by_sport: z.array(AthleteBySportEntry),
});
export type FinalReportResponse = z.infer<typeof FinalReportResponse>;

export const CompetitionPeriodSummary = z.object({
  total_events: z.number(),
  completed_matches: z.number(),
  total_matches: z.number(),
});
export type CompetitionPeriodSummary = z.infer<typeof CompetitionPeriodSummary>;

export const CompetitionReportResponse = z.object({
  competition_id: z.number(),
  number: z.number(),
  status: z.string(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  medal_board: z.array(MedalBoardEntry),
  summary: CompetitionPeriodSummary,
});
export type CompetitionReportResponse = z.infer<typeof CompetitionReportResponse>;

export const AthleteReportResponse = z.object({
  athlete: AthleteResponse,
  delegation_history: z.array(DelegationHistoryItem),
  match_history: z.array(MatchHistoryItem),
  medals: z.array(ResultResponse),
  statistics: z.record(z.string(), z.unknown()),
});
export type AthleteReportResponse = z.infer<typeof AthleteReportResponse>;

export const NarrativeResponse = z.object({
  id: z.number(),
  narrative_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  content: z.string(),
  generated_at: z.string().datetime(),
});
export type NarrativeResponse = z.infer<typeof NarrativeResponse>;

export const AIGenerationResponse = z.object({
  id: z.number(),
  generation_type: z.string(),
  count: z.number(),
  created_at: z.string().datetime(),
});
export type AIGenerationResponse = z.infer<typeof AIGenerationResponse>;
