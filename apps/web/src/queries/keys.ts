export const queryKeys = {
  auth: {
    session: () => ["auth", "session"] as const,
  },
  delegations: {
    all: () => ["delegations"] as const,
    detail: (id: number) => ["delegations", id] as const,
    members: (id: number) => ["delegations", id, "members"] as const,
    history: (id: number) => ["delegations", id, "history"] as const,
    invites: (id: number) => ["delegations", id, "invites"] as const,
  },
  sports: {
    all: () => ["sports"] as const,
    detail: (id: number) => ["sports", id] as const,
  },
  weeks: {
    all: () => ["weeks"] as const,
    detail: (id: number) => ["weeks", id] as const,
    report: (id: number) => ["weeks", id, "report"] as const,
  },
  events: {
    all: () => ["events"] as const,
    byWeek: (weekId: number) => ["events", "week", weekId] as const,
    detail: (id: number) => ["events", id] as const,
  },
  matches: {
    all: () => ["matches"] as const,
    detail: (id: number) => ["matches", id] as const,
  },
  athletes: {
    all: () => ["athletes"] as const,
    detail: (id: number) => ["athletes", id] as const,
    byDelegation: (delegationId: number) =>
      ["athletes", "delegation", delegationId] as const,
    report: (id: number) => ["athletes", id, "report"] as const,
  },
  enrollments: {
    all: () => ["enrollments"] as const,
    list: (params?: Record<string, unknown>) => ["enrollments", params ?? {}] as const,
    byEvent: (eventId: number) => ["enrollments", "event", eventId] as const,
    byDelegation: (delegationId: number) =>
      ["enrollments", "delegation", delegationId] as const,
  },
  results: {
    all: () => ["results"] as const,
    list: (params?: Record<string, unknown>) => ["results", params ?? {}] as const,
    medalBoard: () => ["results", "medal-board"] as const,
    medalBoardSport: (sportId: number) => ["results", "medal-board", "sport", sportId] as const,
    records: (modalityId?: number) => ["results", "records", modalityId ?? "all"] as const,
    standings: (modalityId: number) => ["results", "standings", modalityId] as const,
    byWeek: (weekId: number) => ["results", "week", weekId] as const,
  },
  notifications: {
    list: (userId: number) => ["notifications", userId] as const,
  },
  users: {
    search: (query: string) => ["users", "search", query] as const,
  },
  requests: {
    all: () => ["requests"] as const,
    chief: () => ["requests", "chief"] as const,
  },
  ai: {
    history: () => ["ai", "history"] as const,
    narrative: (date: string) => ["ai", "narrative", date] as const,
  },
  activities: {
    feed: (limit: number) => ["activities", "feed", limit] as const,
  },
} as const;
