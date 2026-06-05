/**
 * Server-side environment access. Do NOT import this from client components.
 * Client code should read `process.env.NEXT_PUBLIC_*` directly.
 */

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

/** Public base URL of the app (used for links, WebAuthn origin/rpID). */
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.AUTH_URL ??
  "http://localhost:3000";

/** WebAuthn Relying Party ID = the registrable domain (hostname, no port). */
export function rpID(): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  return new URL(APP_URL).hostname;
}

/** WebAuthn expected origin = scheme://host[:port]. */
export function rpOrigin(): string {
  return new URL(APP_URL).origin;
}

export const RP_NAME =
  process.env.WEBAUTHN_RP_NAME ?? "Prode Mundial 2026";

export const OWNER_EMAIL = process.env.OWNER_EMAIL?.toLowerCase() ?? null;
