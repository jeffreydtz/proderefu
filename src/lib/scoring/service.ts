import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import {
  DEFAULT_SCORING,
  rankStandings,
  scorePrediction,
  type RankedStanding,
  type ScoringConfig,
  type StandingInput,
} from "./engine";

async function getScoringConfig(): Promise<ScoringConfig> {
  const row = await db.query.settings?.findFirst?.();
  if (!row) return DEFAULT_SCORING;
  return { exact: row.pointsExact, outcome: row.pointsOutcome };
}

/**
 * (Re)compute points for every prediction of one finished match. Idempotent —
 * safe to run any number of times (recomputes from scratch). If the match is
 * not finished or has no scores, all its predictions are reset to unscored.
 */
export async function scoreMatch(matchId: number): Promise<number> {
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });
  if (!match) return 0;

  const preds = await db.query.predictions.findMany({
    where: eq(predictions.matchId, matchId),
  });
  if (preds.length === 0) return 0;

  const config = await getScoringConfig();
  const scored =
    match.status === "finished" &&
    match.homeScore !== null &&
    match.awayScore !== null;

  await db.transaction(async (tx) => {
    for (const p of preds) {
      if (!scored) {
        await tx
          .update(predictions)
          .set({
            pointsAwarded: null,
            exact: null,
            outcomeCorrect: null,
            updatedAt: new Date(),
          })
          .where(eq(predictions.id, p.id));
        continue;
      }
      const result = scorePrediction(
        {
          predHome: p.homeScore,
          predAway: p.awayScore,
          actualHome: match.homeScore!,
          actualAway: match.awayScore!,
        },
        config,
      );
      await tx
        .update(predictions)
        .set({
          pointsAwarded: result.points,
          exact: result.exact,
          outcomeCorrect: result.outcomeCorrect,
          updatedAt: new Date(),
        })
        .where(eq(predictions.id, p.id));
    }
  });

  return preds.length;
}

/** Recompute every finished match. Admin safety net. */
export async function recomputeAll(): Promise<number> {
  const finished = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(eq(matches.status, "finished"), isNotNull(matches.homeScore)),
    );
  let total = 0;
  for (const m of finished) {
    total += await scoreMatch(m.id);
  }
  return total;
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
interface LeaderboardRow {
  user_id: string;
  display_name: string;
  points: number;
  exact_hits: number;
  outcome_hits: number;
  gd_error: number;
  scored_count: number;
}

export type LeaderboardScope = "all" | "group" | "knockout";

export async function getLeaderboard(
  scope: LeaderboardScope = "all",
): Promise<RankedStanding[]> {
  // Extra predicate appended inside every aggregate FILTER so a user with no
  // predictions in the scope still appears (with zeros) via the LEFT JOINs.
  const stageCond =
    scope === "group"
      ? sql`AND m.stage = 'group'`
      : scope === "knockout"
        ? sql`AND m.stage <> 'group'`
        : sql``;
  const rows = (await db.execute(sql`
    SELECT
      u.id AS user_id,
      COALESCE(u.display_name, u.name, u.email, 'Jugador') AS display_name,
      COALESCE(SUM(p.points_awarded) FILTER (WHERE TRUE ${stageCond}), 0)::int AS points,
      COUNT(*) FILTER (WHERE p.exact ${stageCond})::int AS exact_hits,
      COUNT(*) FILTER (WHERE p.outcome_correct AND NOT p.exact ${stageCond})::int AS outcome_hits,
      COALESCE(SUM(
        ABS((p.home_score - p.away_score) - (m.home_score - m.away_score))
      ) FILTER (WHERE p.points_awarded IS NOT NULL ${stageCond}), 0)::int AS gd_error,
      COUNT(*) FILTER (WHERE p.points_awarded IS NOT NULL ${stageCond})::int AS scored_count
    FROM "user" u
    LEFT JOIN predictions p ON p.user_id = u.id
    LEFT JOIN matches m ON m.id = p.match_id
    GROUP BY u.id
  `)) as unknown as LeaderboardRow[];

  const standings: StandingInput[] = rows.map((r) => ({
    userId: r.user_id,
    displayName: r.display_name,
    points: r.points,
    exactHits: r.exact_hits,
    outcomeHits: r.outcome_hits,
    gdError: r.gd_error,
    scoredCount: r.scored_count,
  }));

  return rankStandings(standings);
}
