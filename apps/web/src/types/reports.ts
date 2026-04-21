export interface AthleteBySportEntry {
  sport_id: number
  sport_name: string
  athlete_count: number
}

export interface CompetitionSummary {
  total_delegations: number
  total_athletes: number
  total_weeks: number
  total_events: number
  total_matches: number
  completed_matches: number
}

export interface FinalReportResponse {
  medal_board: import("./results").MedalBoardEntry[]
  records: import("./results").RecordResponse[]
  summary: CompetitionSummary
  athletes_by_sport: AthleteBySportEntry[]
}
