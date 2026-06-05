"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { invites } from "@/db/schema";
import { APP_URL, OWNER_EMAIL } from "@/lib/env";
import { sendAccessRequestEmail } from "@/lib/mail";

export type RequestState =
  | "created"
  | "already_requested"
  | "already_approved"
  | "already_registered";

export interface RequestResult {
  ok: boolean;
  state?: RequestState;
  error?: string;
}

const schema = z.object({
  email: z
    .string()
    .email()
    .transform((s) => s.toLowerCase()),
  name: z.string().trim().min(1).max(40),
});

/**
 * Public self-service access request. Creates (or refreshes) an invite row with
 * status "requested" — which cannot sign in or register until an admin approves
 * it (see auth.ts gate + inviteUsable). Notifies the admin by email if SMTP is on.
 */
export async function requestAccessAction(
  _prev: RequestResult | null,
  formData: FormData,
): Promise<RequestResult> {
  const parsed = schema.safeParse({
    email: String(formData.get("email") ?? ""),
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: "Revisá tu nombre y tu email." };
  }
  const { email, name } = parsed.data;

  const existing = await db.query.invites.findFirst({
    where: eq(invites.email, email),
  });

  if (existing) {
    if (existing.status === "registered")
      return { ok: true, state: "already_registered" };
    if (existing.status === "pending")
      return { ok: true, state: "already_approved" };
    if (existing.status === "requested") {
      await db.update(invites).set({ name }).where(eq(invites.id, existing.id));
      return { ok: true, state: "already_requested" };
    }
    // revoked → reopen as a fresh request
    await db
      .update(invites)
      .set({
        name,
        status: "requested",
        token: crypto.randomUUID(),
        expiresAt: null,
      })
      .where(eq(invites.id, existing.id));
  } else {
    await db.insert(invites).values({
      email,
      name,
      token: crypto.randomUUID(),
      status: "requested",
    });
  }

  if (OWNER_EMAIL) {
    await sendAccessRequestEmail(OWNER_EMAIL, {
      email,
      name,
      url: `${APP_URL}/admin/jugadores`,
    }).catch(() => {});
  }
  return { ok: true, state: "created" };
}
