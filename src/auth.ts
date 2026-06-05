import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  accounts,
  authenticators,
  invites,
  sessions,
  users,
  verificationTokens,
} from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/env";
import {
  finishLogin,
  finishRegistration,
  parseChallengeCookie,
} from "@/lib/passkey";
import type {
  AuthenticationResponseJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";

const emailConfigured = Boolean(process.env.EMAIL_SERVER_HOST);

const providers = [
  // --- Passkey LOGIN (verifies an authentication assertion) -----------------
  Credentials({
    id: "passkey",
    name: "Passkey",
    credentials: { response: {} },
    authorize: async (credentials, request) => {
      const payload = parseChallengeCookie(request);
      if (!payload || typeof credentials?.response !== "string") return null;
      const response = JSON.parse(
        credentials.response,
      ) as AuthenticationResponseJSON;
      return await finishLogin(response, payload);
    },
  }),
  // --- Passkey REGISTER (verifies attestation, gated by invite) -------------
  Credentials({
    id: "passkey-register",
    name: "Passkey Register",
    credentials: { response: {}, displayName: {} },
    authorize: async (credentials, request) => {
      const payload = parseChallengeCookie(request);
      if (!payload || typeof credentials?.response !== "string") return null;
      const response = JSON.parse(
        credentials.response,
      ) as RegistrationResponseJSON;
      const displayName =
        typeof credentials.displayName === "string"
          ? credentials.displayName
          : undefined;
      return await finishRegistration(response, payload, displayName);
    },
  }),
  // Email magic-link fallback (only when SMTP is configured).
  ...(emailConfigured
    ? [
        Nodemailer({
          server: {
            host: process.env.EMAIL_SERVER_HOST,
            port: Number(process.env.EMAIL_SERVER_PORT ?? 465),
            auth: {
              user: process.env.EMAIL_SERVER_USER,
              pass: process.env.EMAIL_SERVER_PASSWORD,
            },
          },
          from: process.env.EMAIL_FROM,
        }),
      ]
    : []),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login?check=email",
    error: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // Passkey providers are already gated (login needs an existing
      // credential; register needs a valid invite). Only the email
      // magic-link path needs an allowlist check here.
      if (account?.provider === "nodemailer") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        const inv = await db.query.invites.findFirst({
          where: eq(invites.email, email),
        });
        if (!inv || inv.status === "revoked") return false;
        if (inv.status === "pending") {
          await db
            .update(invites)
            .set({ status: "registered" })
            .where(eq(invites.id, inv.id));
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
        const email = (user.email ?? "").toLowerCase();
        let role = (user as { role?: "admin" | "player" }).role;
        if (!role) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { role: true },
          });
          role = dbUser?.role ?? "player";
        }
        if (email && email === OWNER_EMAIL && role !== "admin") {
          await db
            .update(users)
            .set({ role: "admin" })
            .where(eq(users.id, user.id));
          role = "admin";
        }
        token.role = role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.role) session.user.role = token.role as "admin" | "player";
      return session;
    },
  },
});
