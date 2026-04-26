export const queryKeys = {
  auth: {
    session: () => ["auth", "session"] as const,
  },
  delegations: {
    all: (leagueId: number) => ["delegations", leagueId] as const,
    detail: (leagueId: number, id: number) => ["delegations", leagueId, id] as const,
    statistics: (leagueId: number, id: number) =>
      ["delegations", leagueId, id, "statistics"] as const,
    members: (leagueId: number, id: number) => ["delegations", leagueId, id, "members"] as const,
    history: (leagueId: number, id: number) => ["delegations", leagueId, id, "history"] as const,
    invites: (leagueId: number, id: number) => ["delegations", leagueId, id, "invites"] as const,
  },
  sports: {
    all: () => ["sports"] as const,
    detail: (id: number) => ["sports", id] as const,
  },
  competitions: {
    all: (leagueId: number) => ["competitions", leagueId] as const,
    detail: (leagueId: number, id: number) => ["competitions", leagueId, id] as const,
    report: (leagueId: number, id: number) => ["competitions", leagueId, id, "report"] as const,
  },
  events: {
    all: (leagueId: number) => ["events", leagueId] as const,
    byCompetition: (leagueId: number, competitionId: number) =>
      ["events", leagueId, "competition", competitionId] as const,
    byWeek: (leagueId: number, competitionId: number) =>
      ["events", leagueId, "competition", competitionId] as const,
    detail: (leagueId: number, id: number) => ["events", leagueId, id] as const,
  },
  matches: {
    all: () => ["matches"] as const,
    detail: (id: number) => ["matches", id] as const,
  },
  athletes: {
    all: (leagueId: number) => ["athletes", leagueId] as const,
    detail: (leagueId: number, id: number) => ["athletes", leagueId, id] as const,
    byDelegation: (leagueId: number, delegationId: number) =>
      ["athletes", leagueId, "delegation", delegationId] as const,
    report: (leagueId: number, id: number) => ["athletes", leagueId, id, "report"] as const,
  },
  enrollments: {
    all: (leagueId: number) => ["enrollments", leagueId] as const,
    list: (leagueId: number, params?: Record<string, unknown>) =>
      ["enrollments", leagueId, params ?? {}] as const,
    byEvent: (leagueId: number, eventId: number) =>
      ["enrollments", leagueId, "event", eventId] as const,
    byDelegation: (leagueId: number, delegationId: number) =>
      ["enrollments", leagueId, "delegation", delegationId] as const,
  },
  results: {
    all: (leagueId: number) => ["results", leagueId] as const,
    list: (leagueId: number, params?: Record<string, unknown>) =>
      ["results", leagueId, params ?? {}] as const,
    medalBoard: (leagueId: number) => ["results", leagueId, "medal-board"] as const,
    medalBoardSport: (leagueId: number, sportId: number) =>
      ["results", leagueId, "medal-board", "sport", sportId] as const,
    records: (leagueId: number, modalityId?: number) =>
      ["results", leagueId, "records", modalityId ?? "all"] as const,
    standings: (leagueId: number, modalityId: number) =>
      ["results", leagueId, "standings", modalityId] as const,
    byCompetition: (leagueId: number, competitionId: number) =>
      ["results", leagueId, "competition", competitionId] as const,
  },
  notifications: {
    list: (userId: number) => ["notifications", userId] as const,
  },
  users: {
    search: (query: string) => ["users", "search", query] as const,
  },
  search: {
    global: (query: string, leagueId?: number) =>
      ["search", "global", query, leagueId ?? "all"] as const,
  },
  requests: {
    all: () => ["requests"] as const,
    chief: () => ["requests", "chief"] as const,
  },
  ai: {
    history: (leagueId: number) => ["ai", leagueId, "history"] as const,
    narrative: (leagueId: number, date: string) => ["ai", leagueId, "narrative", date] as const,
  },
  activities: {
    feed: (leagueId: number | undefined, limit: number) =>
      ["activities", "feed", leagueId ?? "all", limit] as const,
  },
  reports: {
    final: (leagueId: number) => ["reports", leagueId, "final"] as const,
  },
  admin: {
    requests: (leagueId: number) => ["admin", leagueId, "requests"] as const,
  },
  leagues: {
    all: () => ["leagues"] as const,
    detail: (id: number) => ["leagues", id] as const,
    my: () => ["leagues", "my"] as const,
    membership: (id: number) => ["leagues", id, "membership"] as const,
    members: (id: number) => ["leagues", id, "members"] as const,
  },
} as const;
