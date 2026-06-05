import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { getLeaderboard } from "@/lib/scoring/service";
import {
  computeAccuracy,
  computeBestMatchday,
  computeStreak,
  type UserStats,
} from "@/lib/stats";

export async function getUserStats(userId: string): Promise<UserStats> {
  const board = await getLeaderboard();
  const me = board.find((r) => r.userId === userId);

  const poolAvgPoints =
    board.length > 0
      ? Math.round(board.reduce((s, r) => s + r.points, 0) / board.length)
      : 0;

  const rows = await db.query.predictions.findMany({
    where: eq(predictions.userId, userId),
    with: { match: { columns: { matchday: true, kickoff: true } } },
  });

  const totalPoints = me?.points ?? 0;
  const exactHits = me?.exactHits ?? 0;
  const outcomeHits = me?.outcomeHits ?? 0;
  const scoredCount = me?.scoredCount ?? 0;

  return {
    userId,
    displayName: me?.displayName ?? "Jugador",
    totalPoints,
    exactHits,
    outcomeHits,
    scoredCount,
    predictedCount: rows.length,
    accuracyPct: computeAccuracy(exactHits + outcomeHits, scoredCount),
    bestMatchday: computeBestMatchday(
      rows.map((r) => ({
        matchday: r.match?.matchday ?? null,
        pointsAwarded: r.pointsAwarded,
      })),
    ),
    currentStreak: computeStreak(
      rows.map((r) => ({
        pointsAwarded: r.pointsAwarded,
        kickoff: r.match?.kickoff ?? new Date(0),
      })),
    ),
    rank: me?.rank ?? board.length + 1,
    tied: me?.tied ?? false,
    poolAvgPoints,
    vsAvg: totalPoints - poolAvgPoints,
  };
}
