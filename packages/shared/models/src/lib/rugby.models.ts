export enum MatchOutcome {
  HOME = 'HOME',
  DRAW = 'DRAW',
  AWAY = 'AWAY',
}

export enum MatchdayStatus {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
}

export interface MatchResult {
  outcome: MatchOutcome;
  offensiveBonusAwarded: boolean;
  defensiveBonusAwarded: boolean;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  scheduledAt: string;
  result?: MatchResult;
}

export interface Matchday {
  id: string;
  label: string;
  date: string;
  matches: Match[];
}

export interface Competition {
  id: string;
  name: string;
  season: string;
  matchdayIds: string[];
  status: 'active' | 'finished';
}

export interface Player {
  id: string;
  displayName: string;
}

export interface Prediction {
  id: string;
  playerId: string;
  matchId: string;
  outcome: MatchOutcome;
  offensiveBonusPredicted: boolean;
  defensiveBonusPredicted: boolean;
}

export interface RankingEntry {
  playerId: string;
  displayName: string;
  points: number;
  rank: number;
}
