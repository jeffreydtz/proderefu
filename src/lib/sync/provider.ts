import type { MatchStatus } from "@/db/schema";

/** A normalized score/status update for a single match from any provider. */
export interface MatchUpdate {
  providerId?: string;
  utcDate: string; // ISO instant
  home: string; // provider's team name (normalized at match time)
  away: string;
  status: MatchStatus;
  /** Regulation + extra-time (120') score — NOT including penalties. */
  homeScore: number | null;
  awayScore: number | null;
  /** Penalty shootout — display/bracket only, never scored. */
  homePens: number | null;
  awayPens: number | null;
}

export interface FootballProvider {
  name: string;
  fetchMatches(competitionCode: string): Promise<MatchUpdate[]>;
}
