export interface Team {
  id: string;
  name: string;
  logo?: string;
  seed?: number;
}

export interface MatchTeam {
  team: Team | null;
  score: number;
  isWinner?: boolean;
}

export interface Match {
  id: string;
  round: number;
  position: number;
  bestOf?: number;
  scheduledAt?: Date | string;
  status?: MatchStatus;
  teams: [MatchTeam, MatchTeam];
}

export type MatchStatus = "upcoming" | "live" | "completed";

export interface Round {
  name: string;
  matches: Match[];
}

export interface SingleEliminationBracket {
  type: "single-elimination";
  rounds: Round[];
}

export interface DoubleEliminationBracket {
  type: "double-elimination";
  upper: Round[];
  lower: Round[];
  grandFinal?: Match;
}

export interface SwissStanding {
  team: Team;
  wins: number;
  losses: number;
  tiebreaker?: number;
  status?: "advancing" | "eliminated" | "pending";
}

export interface SwissRound {
  name: string;
  record?: string;
  matches: Match[];
}

export interface SwissBracket {
  type: "swiss";
  rounds: SwissRound[];
  standings: SwissStanding[];
  winsToAdvance: number;
  lossesToEliminate: number;
}

export interface GroupStanding {
  team: Team;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  differential: number;
}

export interface Group {
  name: string;
  teams: Team[];
  matches: Match[];
  standings: GroupStanding[];
}

export interface GroupStageBracket {
  type: "group-stage";
  groups: Group[];
}

export type Bracket =
  | SingleEliminationBracket
  | DoubleEliminationBracket
  | SwissBracket
  | GroupStageBracket;
