"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { invites, users } from "@/db/schema";
import { APP_URL, OWNER_EMAIL } from "@/lib/env";
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
  } else if (existing.status === "revoked" || existing.status === "requested") {
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

/** Approve a self-service access request: turn it into an active invite. */
export async function approveRequestAction(id: string): Promise<InviteResult> {
  const admin = await requireAdmin();
  const inv = await db.query.invites.findFirst({ where: eq(invites.id, id) });
  if (!inv) return { ok: false, error: "No existe la solicitud." };
  const token = crypto.randomUUID();
  await db
    .update(invites)
    .set({
      status: "pending",
      token,
      invitedBy: admin.id,
      expiresAt: new Date(Date.now() + EXPIRY_MS),
    })
    .where(eq(invites.id, id));
  const inviteUrl = `${APP_URL}/invite/${token}`;
  const emailed = await sendInviteEmail(inv.email, inviteUrl).catch(() => false);
  revalidatePath("/admin/jugadores");
  return { ok: true, inviteUrl, emailed };
}

/** Reject an access request (or revoke any invite). */
export async function rejectRequestAction(id: string): Promise<void> {
  await requireAdmin();
  await db
    .update(invites)
    .set({ status: "revoked" })
    .where(eq(invites.id, id));
  revalidatePath("/admin/jugadores");
}

/**
 * Remove a registered player entirely: deletes the user row (cascades their
 * predictions + passkeys) so they disappear from the leaderboard, and revokes
 * their invite so they can't re-register without a new approval. Cannot remove
 * yourself or the owner.
 */
export async function removePlayerAction(
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (userId === admin.id) {
    return { ok: false, error: "No te podés eliminar a vos mismo." };
  }
  const u = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!u) return { ok: false, error: "No existe el jugador." };
  if (u.email && OWNER_EMAIL && u.email.toLowerCase() === OWNER_EMAIL) {
    return { ok: false, error: "No se puede eliminar al organizador." };
  }
  await db.transaction(async (tx) => {
    if (u.email) {
      await tx
        .update(invites)
        .set({ status: "revoked" })
        .where(eq(invites.email, u.email.toLowerCase()));
    }
    await tx.delete(users).where(eq(users.id, userId));
  });
  revalidatePath("/admin/jugadores");
  revalidatePath("/tabla");
  return { ok: true };
}
