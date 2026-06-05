"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { matches } from "@/db/schema";
import { winnerOf } from "@/lib/match-result";
import { scoreMatch } from "@/lib/scoring/service";
import { requireAdmin } from "@/lib/session";

export interface ResultState {
  ok: boolean;
  matchId?: number;
  error?: string;
}

const score = z.coerce.number().int().min(0).max(99);

function parsePen(v: FormDataEntryValue | null): number | null {
  if (!v) return null;
  const r = score.safeParse(v);
  return r.success ? r.data : null;
}

const REVALIDATE = [
  "/tabla",
  "/partidos",
  "/grupos",
  "/llave",
  "/perfil",
  "/admin/resultados",
];

export async function saveManualResultAction(
  _prev: ResultState | null,
  formData: FormData,
): Promise<ResultState> {
  await requireAdmin();
  const matchId = Number(formData.get("matchId"));
  if (!Number.isInteger(matchId)) return { ok: false, error: "Partido inválido." };

  const home = score.safeParse(formData.get("home"));
  const away = score.safeParse(formData.get("away"));
  if (!home.success || !away.success)
    return { ok: false, matchId, error: "Cargá ambos marcadores." };

  const homePens = parsePen(formData.get("homePens"));
  const awayPens = parsePen(formData.get("awayPens"));

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });
  if (!match) return { ok: false, matchId, error: "No existe el partido." };
  if (match.homeTeamId == null || match.awayTeamId == null)
    return {
      ok: false,
      matchId,
      error: "Faltan los equipos (definí la llave primero).",
    };

  const winnerTeamId = winnerOf(
    match.homeTeamId,
    match.awayTeamId,
    home.data,
    away.data,
    homePens,
    awayPens,
  );

  await db
    .update(matches)
    .set({
      homeScore: home.data,
      awayScore: away.data,
      homePens,
      awayPens,
      status: "finished",
      scoreSource: "manual",
      manualLocked: true,
      winnerTeamId,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));

  await scoreMatch(matchId);
  for (const p of REVALIDATE) revalidatePath(p);
  return { ok: true, matchId };
}

/** Release the manual lock so the sync provider can own this match again. */
export async function clearManualLockAction(matchId: number): Promise<void> {
  await requireAdmin();
  await db
    .update(matches)
    .set({ manualLocked: false })
    .where(eq(matches.id, matchId));
  revalidatePath("/admin/resultados");
}
