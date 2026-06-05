"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { isLocked } from "@/lib/format";
import { isEditable, predictionEditable } from "@/lib/predictions-guard";
import { getPhaseState } from "@/lib/queries/matches";
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
  const [rows, existing, phase] = await Promise.all([
    db
      .select({
        id: matches.id,
        kickoff: matches.kickoff,
        status: matches.status,
        stage: matches.stage,
      })
      .from(matches)
      .where(inArray(matches.id, ids)),
    db
      .select({
        id: predictions.id,
        matchId: predictions.matchId,
        editApprovedAt: predictions.editApprovedAt,
      })
      .from(predictions)
      .where(
        and(eq(predictions.userId, user.id), inArray(predictions.matchId, ids)),
      ),
    getPhaseState(),
  ]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const predByMatch = new Map(existing.map((p) => [p.matchId, p]));

  const now = new Date();
  const rejected: number[] = [];
  const inserts: { matchId: number; home: number; away: number }[] = [];
  const updates: { id: number; home: number; away: number }[] = [];
  for (const [id, v] of wanted) {
    const match = byId.get(id);
    const prev = predByMatch.get(id);
    const matchEditable =
      !!match && isEditable(match, now, phase.groupStageComplete);
    const ok = predictionEditable({
      matchEditable,
      hasRow: !!prev,
      editApprovedAt: prev?.editApprovedAt ?? null,
    });
    if (!ok) {
      rejected.push(id);
      continue;
    }
    if (prev) updates.push({ id: prev.id, home: v.home!, away: v.away! });
    else inserts.push({ matchId: id, home: v.home!, away: v.away! });
  }

  const savedCount = inserts.length + updates.length;
  if (savedCount) {
    await db.transaction(async (tx) => {
      for (const p of inserts) {
        await tx.insert(predictions).values({
          userId: user.id,
          matchId: p.matchId,
          homeScore: p.home,
          awayScore: p.away,
        });
      }
      // An approved edit is consumed here: clear the flags so it re-locks.
      for (const p of updates) {
        await tx
          .update(predictions)
          .set({
            homeScore: p.home,
            awayScore: p.away,
            editRequestedAt: null,
            editApprovedAt: null,
            updatedAt: new Date(),
          })
          .where(eq(predictions.id, p.id));
      }
    });
  }

  revalidatePath("/pronosticos");
  revalidatePath("/tabla");
  return { ok: true, saved: savedCount, rejected };
}

/**
 * Player requests permission to edit an already-saved prediction. Flags it for
 * admin approval (see /admin/ediciones). Idempotent; no-op if already approved.
 */
export async function requestPredictionEditAction(
  matchId: number,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    columns: { id: true, kickoff: true, status: true },
  });
  if (!match) return { ok: false, error: "No existe el partido." };
  if (isLocked(match.kickoff, match.status)) {
    return { ok: false, error: "El partido ya empezó." };
  }
  const pred = await db.query.predictions.findFirst({
    where: and(
      eq(predictions.userId, user.id),
      eq(predictions.matchId, matchId),
    ),
  });
  if (!pred) {
    return { ok: false, error: "Todavía no cargaste un pronóstico para editar." };
  }
  if (pred.editApprovedAt) return { ok: true }; // already approved
  await db
    .update(predictions)
    .set({ editRequestedAt: new Date() })
    .where(eq(predictions.id, pred.id));
  revalidatePath("/pronosticos");
  revalidatePath("/admin/ediciones");
  return { ok: true };
}
