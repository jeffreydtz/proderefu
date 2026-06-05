"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

/** Approve an edit request — grants the player exactly one edit (consumed on save). */
export async function approvePredictionEditAction(
  id: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  await db
    .update(predictions)
    .set({ editApprovedAt: new Date() })
    .where(eq(predictions.id, id));
  revalidatePath("/admin/ediciones");
  revalidatePath("/pronosticos");
  return { ok: true };
}

/** Reject an edit request — clears the pending flag (prediction stays fixed). */
export async function rejectPredictionEditAction(
  id: number,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  await db
    .update(predictions)
    .set({ editRequestedAt: null })
    .where(eq(predictions.id, id));
  revalidatePath("/admin/ediciones");
  revalidatePath("/pronosticos");
  return { ok: true };
}
