/**
 * Pure scoring logic for the prode. No DB, no I/O — fully unit-testable.
 *
 * Rules (default): resultado EXACTO = 3 pts, acertar el RESULTADO
 * (gana/empata/pierde) sin exacto = 1 pt, errar = 0.
 *
 * IMPORTANT: scoring uses the 90'/120' (regulation + extra-time) result only.
 * Penalty shootouts do NOT affect points — a knockout that ends 1-1 and is
 * decided on penalties counts as a DRAW for prediction scoring. Callers must
 * pass the regulation/ET score, never the shootout score.
 */

export interface ScoringConfig {
  exact: number;
  outcome: number;
}

export const DEFAULT_SCORING: ScoringConfig = { exact: 3, outcome: 1 };

export interface ScoreInput {
  predHome: number;
  predAway: number;
  actualHome: number;
  actualAway: number;
}

export interface ScoreResult {
  points: number;
  exact: boolean;
  outcomeCorrect: boolean;
}

/** -1 = away wins, 0 = draw, 1 = home wins. */
export function sign(diff: number): -1 | 0 | 1 {
  return Math.sign(diff) as -1 | 0 | 1;
}

export function scorePrediction(
  input: ScoreInput,
  config: ScoringConfig = DEFAULT_SCORING,
): ScoreResult {
  const { predHome, predAway, actualHome, actualAway } = input;

  const exact = predHome === actualHome && predAway === actualAway;
  if (exact) {
    return { points: config.exact, exact: true, outcomeCorrect: true };
  }

  const outcomeCorrect = sign(predHome - predAway) === sign(actualHome - actualAway);
  return {
    points: outcomeCorrect ? config.outcome : 0,
    exact: false,
    outcomeCorrect,
  };
}

/** Goal-difference error of a prediction vs the actual result (tiebreaker). */
export function goalDiffError(input: ScoreInput): number {
  const predDiff = input.predHome - input.predAway;
  const actualDiff = input.actualHome - input.actualAway;
  return Math.abs(predDiff - actualDiff);
}

// ---------------------------------------------------------------------------
// Leaderboard ranking + tiebreakers
// ---------------------------------------------------------------------------
export interface StandingInput {
  userId: string;
  displayName: string;
  points: number;
  exactHits: number;
  outcomeHits: number;
  /** Sum of |predDiff - actualDiff| across scored matches. Lower is better. */
  gdError: number;
  scoredCount: number;
}

export interface RankedStanding extends StandingInput {
  rank: number;
  /** true when this user shares its rank with another (e.g. "=3"). */
  tied: boolean;
}

/**
 * Tiebreakers, in order:
 *   1) points (desc)
 *   2) exact hits (desc)
 *   3) outcome hits (desc)
 *   4) goal-difference error (asc — smaller error wins)
 *   5) display name (asc — stable final fallback)
 * Users tied through 1–4 share a rank ("=").
 */
export function rankStandings(rows: StandingInput[]): RankedStanding[] {
  const sorted = [...rows].sort(compareStandings);

  const result: RankedStanding[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    let rank: number;
    if (i > 0 && tiedForRank(sorted[i - 1], row)) {
      rank = result[i - 1].rank; // same rank as previous
    } else {
      rank = i + 1; // standard competition ranking (1,2,2,4,...)
    }
    result.push({ ...row, rank, tied: false });
  }

  // mark shared ranks
  const counts = new Map<number, number>();
  for (const r of result) counts.set(r.rank, (counts.get(r.rank) ?? 0) + 1);
  for (const r of result) r.tied = (counts.get(r.rank) ?? 0) > 1;

  return result;
}

function compareStandings(a: StandingInput, b: StandingInput): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
  if (b.outcomeHits !== a.outcomeHits) return b.outcomeHits - a.outcomeHits;
  if (a.gdError !== b.gdError) return a.gdError - b.gdError;
  return a.displayName.localeCompare(b.displayName, "es");
}

/** Two rows are tied for rank when equal through tiebreakers 1–4. */
function tiedForRank(a: StandingInput, b: StandingInput): boolean {
  return (
    a.points === b.points &&
    a.exactHits === b.exactHits &&
    a.outcomeHits === b.outcomeHits &&
    a.gdError === b.gdError
  );
}
