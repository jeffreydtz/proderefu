"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { isEditable } from "@/lib/predictions-guard";
import { requireUser } from "@/lib/session";

export interface SaveResult {
  ok: boolean;
  saved: number;
  rejected: number[];
  error?: string;
}

const scoreSchema = z.coerce.number().int().min(0).max(99);

/**
 * Bulk-save a day's predictions. Server-trusted: re-reads each match and
 * rejects any that are locked (kicked off / not scheduled). Never sets points.
 * Designed for React `useActionState(prev, formData)`.
 */
export async function savePredictionsAction(
  _prev: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const user = await requireUser();

  // Collect m_<id>_home / m_<id>_away pairs.
  const entries = new Map<number, { home?: number; away?: number }>();
  for (const [key, value] of formData.entries()) {
    const m = key.match(/^m_(\d+)_(home|away)$/);
    if (!m) continue;
    const parsed = scoreSchema.safeParse(value);
    if (!parsed.success) continue;
    const id = Number(m[1]);
    const side = m[2] as "home" | "away";
    const e = entries.get(id) ?? {};
    e[side] = parsed.data;
    entries.set(id, e);
  }

  const wanted = [...entries.entries()].filter(
    ([, v]) => v.home !== undefined && v.away !== undefined,
  );
  if (wanted.length === 0) return { ok: true, saved: 0, rejected: [] };

  const ids = wanted.map(([id]) => id);
  const rows = await db
    .select({
      id: matches.id,
      kickoff: matches.kickoff,
      status: matches.status,
    })
    .from(matches)
    .where(inArray(matches.id, ids));
  const byId = new Map(rows.map((r) => [r.id, r]));

  const now = new Date();
  const rejected: number[] = [];
  const toUpsert: { matchId: number; home: number; away: number }[] = [];
  for (const [id, v] of wanted) {
    const match = byId.get(id);
    if (!match || !isEditable(match, now)) {
      rejected.push(id);
      continue;
    }
    toUpsert.push({ matchId: id, home: v.home!, away: v.away! });
  }

  if (toUpsert.length) {
    await db.transaction(async (tx) => {
      for (const p of toUpsert) {
        await tx
          .insert(predictions)
          .values({
            userId: user.id,
            matchId: p.matchId,
            homeScore: p.home,
            awayScore: p.away,
          })
          .onConflictDoUpdate({
            target: [predictions.userId, predictions.matchId],
            set: {
              homeScore: p.home,
              awayScore: p.away,
              updatedAt: new Date(),
            },
          });
      }
    });
  }

  revalidatePath("/pronosticos");
  revalidatePath("/tabla");
  return { ok: true, saved: toUpsert.length, rejected };
}
