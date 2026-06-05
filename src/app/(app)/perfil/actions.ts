"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/session";

export interface NameResult {
  ok: boolean;
  name?: string;
  error?: string;
}

const nameSchema = z
  .string()
  .trim()
  .min(1, "Poné un nombre.")
  .max(40, "Máximo 40 caracteres.");

/** Let a player rename themselves — this is the name shown in the tabla. */
export async function updateDisplayNameAction(
  _prev: NameResult | null,
  formData: FormData,
): Promise<NameResult> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Nombre inválido." };
  }
  const name = parsed.data;
  await db.update(users).set({ displayName: name }).where(eq(users.id, user.id));
  revalidatePath("/perfil");
  revalidatePath("/tabla");
  return { ok: true, name };
}
