"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { recomputeAll } from "@/lib/scoring/service";
import { requireAdmin } from "@/lib/session";
import { runSync, type SyncResult } from "@/lib/sync/run";

export interface ScoringState {
  ok: boolean;
  error?: string;
}

const pts = z.coerce.number().int().min(0).max(20);

export async function updateScoringSettingsAction(
  _prev: ScoringState | null,
  formData: FormData,
): Promise<ScoringState> {
  await requireAdmin();
  const exact = pts.safeParse(formData.get("exact"));
  const outcome = pts.safeParse(formData.get("outcome"));
  if (!exact.success || !outcome.success)
    return { ok: false, error: "Valores inválidos (0–20)." };

  await db
    .update(settings)
    .set({ pointsExact: exact.data, pointsOutcome: outcome.data })
    .where(eq(settings.id, 1));
  await recomputeAll();
  for (const p of ["/tabla", "/perfil", "/admin/ajustes"]) revalidatePath(p);
  return { ok: true };
}

export async function toggleSyncAction(): Promise<{ enabled: boolean }> {
  await requireAdmin();
  const s = await db.query.settings.findFirst();
  const enabled = !(s?.syncEnabled ?? true);
  await db.update(settings).set({ syncEnabled: enabled }).where(eq(settings.id, 1));
  revalidatePath("/admin/ajustes");
  return { enabled };
}

export async function recomputeAllAction(): Promise<{ updated: number }> {
  await requireAdmin();
  const updated = await recomputeAll();
  for (const p of ["/tabla", "/perfil", "/admin/ajustes"]) revalidatePath(p);
  return { updated };
}

export async function runSyncNowAction(): Promise<SyncResult> {
  await requireAdmin();
  const res = await runSync("admin-manual", true);
  for (const p of ["/tabla", "/partidos", "/grupos", "/llave", "/admin/ajustes"])
    revalidatePath(p);
  return res;
}
