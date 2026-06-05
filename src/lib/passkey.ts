import "server-only";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { authenticators, invites, users } from "@/db/schema";
import { OWNER_EMAIL, RP_NAME, rpID, rpOrigin } from "@/lib/env";

export const CHALLENGE_COOKIE = "prode_webauthn";

export interface ChallengePayload {
  type: "register" | "login";
  challenge: string;
  email?: string;
  userId?: string;
}

export function serializeChallenge(payload: ChallengePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function deserializeChallenge(value: string): ChallengePayload | null {
  try {
    return JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as ChallengePayload;
  } catch {
    return null;
  }
}

/** Read + decode the challenge cookie from a raw Request (used in authorize). */
export function parseChallengeCookie(req: Request): ChallengePayload | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  const match = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CHALLENGE_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(CHALLENGE_COOKIE.length + 1));
  return deserializeChallenge(value);
}

export interface PublicUser {
  id: string;
  email: string | null;
  name: string | null;
  role: "admin" | "player";
}

// ---------------------------------------------------------------------------
// Registration (gated by a valid pending invite)
// ---------------------------------------------------------------------------
export async function getInviteByToken(token: string) {
  const invite = await db.query.invites.findFirst({
    where: eq(invites.token, token),
  });
  return invite ?? null;
}

function inviteUsable(invite: {
  status: string;
  expiresAt: Date | null;
}): boolean {
  if (invite.status !== "pending") return false;
  if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) return false;
  return true;
}

export async function buildRegistrationOptions(token: string) {
  const invite = await getInviteByToken(token);
  if (!invite || !inviteUsable(invite)) {
    throw new Error("Invitación inválida o expirada.");
  }
  const userId = crypto.randomUUID();
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: rpID(),
    userName: invite.email,
    userID: new TextEncoder().encode(userId),
    userDisplayName: invite.email,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });
  const payload: ChallengePayload = {
    type: "register",
    challenge: options.challenge,
    email: invite.email.toLowerCase(),
    userId,
  };
  return { options, payload, email: invite.email };
}

export async function finishRegistration(
  response: RegistrationResponseJSON,
  payload: ChallengePayload,
  displayName: string | undefined,
): Promise<PublicUser | null> {
  if (payload.type !== "register" || !payload.email || !payload.userId) {
    return null;
  }
  const invite = await db.query.invites.findFirst({
    where: eq(invites.email, payload.email),
  });
  if (!invite || !inviteUsable(invite)) return null;

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: payload.challenge,
    expectedOrigin: rpOrigin(),
    expectedRPID: rpID(),
    requireUserVerification: false,
  });
  if (!verification.verified || !verification.registrationInfo) return null;

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  const role = payload.email === OWNER_EMAIL ? "admin" : "player";
  const cleanName = displayName?.trim() || payload.email.split("@")[0];

  const user: PublicUser = {
    id: payload.userId,
    email: payload.email,
    name: cleanName,
    role,
  };

  await db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({
        id: payload.userId!,
        email: payload.email!,
        name: cleanName,
        displayName: cleanName,
        emailVerified: new Date(),
        role,
      })
      .onConflictDoNothing();
    await tx.insert(authenticators).values({
      credentialID: credential.id,
      userId: payload.userId!,
      providerAccountId: credential.id,
      credentialPublicKey: isoBase64URL.fromBuffer(credential.publicKey),
      counter: credential.counter,
      credentialDeviceType,
      credentialBackedUp,
      transports: credential.transports?.join(",") ?? null,
    });
    await tx
      .update(invites)
      .set({ status: "registered" })
      .where(eq(invites.id, invite.id));
  });

  return user;
}

// ---------------------------------------------------------------------------
// Authentication (login)
// ---------------------------------------------------------------------------
export async function buildLoginOptions() {
  const options = await generateAuthenticationOptions({
    rpID: rpID(),
    userVerification: "preferred",
    // Empty allowCredentials => discoverable (resident) credentials; the
    // platform shows the user's available passkeys for this site.
    allowCredentials: [],
  });
  const payload: ChallengePayload = {
    type: "login",
    challenge: options.challenge,
  };
  return { options, payload };
}

export async function finishLogin(
  response: AuthenticationResponseJSON,
  payload: ChallengePayload,
): Promise<PublicUser | null> {
  if (payload.type !== "login") return null;

  const authenticator = await db.query.authenticators.findFirst({
    where: eq(authenticators.credentialID, response.id),
  });
  if (!authenticator) return null;

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: payload.challenge,
    expectedOrigin: rpOrigin(),
    expectedRPID: rpID(),
    requireUserVerification: false,
    credential: {
      id: authenticator.credentialID,
      publicKey: isoBase64URL.toBuffer(authenticator.credentialPublicKey),
      counter: authenticator.counter,
      transports: authenticator.transports
        ? (authenticator.transports.split(",") as AuthenticatorTransportFuture[])
        : undefined,
    },
  });
  if (!verification.verified) return null;

  await db
    .update(authenticators)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    })
    .where(
      and(
        eq(authenticators.credentialID, authenticator.credentialID),
        eq(authenticators.userId, authenticator.userId),
      ),
    );

  const user = await db.query.users.findFirst({
    where: eq(users.id, authenticator.userId),
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.displayName ?? user.name,
    role: user.role,
  };
}
