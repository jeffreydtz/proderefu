import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import type { Prediction } from "@/db/schema";

/** All of a user's predictions, keyed by matchId (one query). */
export async function getUserPredictionsMap(
  userId: string,
): Promise<Map<number, Prediction>> {
  const rows = await db.query.predictions.findMany({
    where: eq(predictions.userId, userId),
  });
  return new Map(rows.map((p) => [p.matchId, p]));
}

export type MatchPrediction = Prediction & {
  user: {
    id: string;
    displayName: string | null;
    name: string | null;
    email: string | null;
  } | null;
};

/** Every player's prediction for one match, with the player joined. */
export async function getMatchPredictions(
  matchId: number,
): Promise<MatchPrediction[]> {
  return db.query.predictions.findMany({
    where: eq(predictions.matchId, matchId),
    with: {
      user: {
        columns: { id: true, displayName: true, name: true, email: true },
      },
    },
  });
}
