// Pure stats helpers — no DB, unit-testable.

export interface UserStats {
  userId: string;
  displayName: string;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
  exactHits: number;
  outcomeHits: number;
  scoredCount: number;
  predictedCount: number;
  accuracyPct: number;
  bestMatchday: { matchday: number; points: number } | null;
  currentStreak: number;
  rank: number;
  tied: boolean;
  poolAvgPoints: number;
  vsAvg: number;
}

export interface ScoredPred {
  pointsAwarded: number | null;
  kickoff: Date;
}

/** % of scored predictions that earned any points (exact + outcome). */
export function computeAccuracy(hits: number, scored: number): number {
  return scored > 0 ? Math.round((hits / scored) * 100) : 0;
}

/** Trailing run of consecutive scored matches (chronological) with points > 0. */
export function computeStreak(preds: ScoredPred[]): number {
  const scored = preds
    .filter((p) => p.pointsAwarded != null)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  let streak = 0;
  for (let i = scored.length - 1; i >= 0; i--) {
    if ((scored[i].pointsAwarded ?? 0) > 0) streak++;
    else break;
  }
  return streak;
}

/** Best single group matchday by total points (ignores knockout, matchday=null). */
export function computeBestMatchday(
  preds: { matchday: number | null; pointsAwarded: number | null }[],
): { matchday: number; points: number } | null {
  const byMd = new Map<number, number>();
  for (const p of preds) {
    if (p.matchday == null || p.pointsAwarded == null) continue;
    byMd.set(p.matchday, (byMd.get(p.matchday) ?? 0) + p.pointsAwarded);
  }
  let best: { matchday: number; points: number } | null = null;
  for (const [matchday, points] of byMd) {
    if (!best || points > best.points) best = { matchday, points };
  }
  return best;
}
