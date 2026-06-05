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
