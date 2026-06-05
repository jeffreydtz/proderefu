"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { APP_URL } from "@/lib/env";
import { sendInviteEmail } from "@/lib/mail";
import { requireAdmin } from "@/lib/session";

export interface InviteResult {
  ok: boolean;
  inviteUrl?: string;
  emailed?: boolean;
  error?: string;
}

const emailSchema = z
  .string()
  .email()
  .transform((s) => s.toLowerCase());

const EXPIRY_MS = 14 * 24 * 60 * 60 * 1000;

export async function invitePlayerAction(
  _prev: InviteResult | null,
  formData: FormData,
): Promise<InviteResult> {
  const admin = await requireAdmin();
  const parsed = emailSchema.safeParse(String(formData.get("email") ?? ""));
  if (!parsed.success) return { ok: false, error: "Email inválido." };
  const email = parsed.data;

  const existing = await db.query.invites.findFirst({
    where: eq(invites.email, email),
  });

  let token: string;
  if (!existing) {
    token = crypto.randomUUID();
    await db.insert(invites).values({
      email,
      token,
      invitedBy: admin.id,
      expiresAt: new Date(Date.now() + EXPIRY_MS),
    });
  } else if (existing.status === "revoked") {
    token = crypto.randomUUID();
    await db
      .update(invites)
      .set({
        status: "pending",
        token,
        expiresAt: new Date(Date.now() + EXPIRY_MS),
      })
      .where(eq(invites.id, existing.id));
  } else {
    token = existing.token;
  }

  const inviteUrl = `${APP_URL}/invite/${token}`;
  const emailed = await sendInviteEmail(email, inviteUrl).catch(() => false);
  revalidatePath("/admin/jugadores");
  return { ok: true, inviteUrl, emailed };
}

export async function revokeInviteAction(id: string): Promise<void> {
  await requireAdmin();
  await db
    .update(invites)
    .set({ status: "revoked" })
    .where(eq(invites.id, id));
  revalidatePath("/admin/jugadores");
}

export async function resendInviteAction(id: string): Promise<InviteResult> {
  await requireAdmin();
  const inv = await db.query.invites.findFirst({ where: eq(invites.id, id) });
  if (!inv) return { ok: false, error: "No existe la invitación." };
  const inviteUrl = `${APP_URL}/invite/${inv.token}`;
  const emailed = await sendInviteEmail(inv.email, inviteUrl).catch(() => false);
  return { ok: true, inviteUrl, emailed };
}
