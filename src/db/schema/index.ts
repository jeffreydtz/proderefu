import {
  boolean,
  char,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ----------------------------------------------------------------------------
// Enums
// ----------------------------------------------------------------------------
export const roleEnum = pgEnum("role", ["admin", "player"]);
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "registered",
  "revoked",
  "requested", // self-service access request, awaiting admin approval
]);
export const stageEnum = pgEnum("stage", [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
]);
export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
  "postponed",
  "cancelled",
]);
export const scoreSourceEnum = pgEnum("score_source", ["api", "manual"]);

// ----------------------------------------------------------------------------
// Auth.js core tables (shape required by @auth/drizzle-adapter)
// + app-specific columns on `users`.
// ----------------------------------------------------------------------------
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  // app columns
  role: roleEnum("role").notNull().default("player"),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// Passkey credentials (WebAuthn). Managed by our own SimpleWebAuthn routes.
export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),
  },
  (a) => [primaryKey({ columns: [a.userId, a.credentialID] })],
);

// ----------------------------------------------------------------------------
// Closed access — the allowlist. No row => no access.
// ----------------------------------------------------------------------------
export const invites = pgTable("invites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(), // always stored lowercased
  name: text("name"), // requester's display name (self-service requests)
  token: text("token").notNull().unique(),
  status: inviteStatusEnum("status").notNull().default("pending"),
  invitedBy: text("invited_by").references(() => users.id, {
    onDelete: "set null",
  }),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ----------------------------------------------------------------------------
// Tournament structure
// ----------------------------------------------------------------------------
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  externalId: text("external_id").unique(),
  name: text("name").notNull(),
  shortName: text("short_name"),
  code: text("code"), // 3-letter FIFA code
  flagUrl: text("flag_url"),
  groupLetter: char("group_letter", { length: 1 }), // A..L (group stage)
});

export const matches = pgTable(
  "matches",
  {
    id: serial("id").primaryKey(),
    externalId: text("external_id").unique(), // join key for sync
    stage: stageEnum("stage").notNull(),
    groupLetter: char("group_letter", { length: 1 }), // group stage only
    matchday: integer("matchday"), // group matchday 1..3
    homeTeamId: integer("home_team_id").references(() => teams.id),
    awayTeamId: integer("away_team_id").references(() => teams.id),
    // Knockout slots may be unknown until groups finish:
    homePlaceholder: text("home_placeholder"), // e.g. "1A", "2B", "W73"
    awayPlaceholder: text("away_placeholder"),
    kickoff: timestamp("kickoff", { withTimezone: true }).notNull(),
    venue: text("venue"),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    // Regulation / extra-time (120') result — used for scoring:
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    // Penalty shootout — display / bracket only, NOT scored:
    homePens: integer("home_pens"),
    awayPens: integer("away_pens"),
    winnerTeamId: integer("winner_team_id").references(() => teams.id),
    scoreSource: scoreSourceEnum("score_source").notNull().default("api"),
    // When true, sync NEVER overwrites this match (manual override lock):
    manualLocked: boolean("manual_locked").notNull().default(false),
    lastSyncedAt: timestamp("last_synced_at", { mode: "date" }),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (m) => [
    // helps the sync window gate and listings
    unique("matches_external_uq").on(m.externalId),
    index("matches_kickoff_idx").on(m.kickoff),
    index("matches_stage_idx").on(m.stage),
    index("matches_group_idx").on(m.groupLetter),
  ],
);

// ----------------------------------------------------------------------------
// Predictions — one per (user, match). Players predict the 120' scoreline only.
// ----------------------------------------------------------------------------
export const predictions = pgTable(
  "predictions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    homeScore: integer("home_score").notNull(),
    awayScore: integer("away_score").notNull(),
    pointsAwarded: integer("points_awarded"), // null => not scored yet
    outcomeCorrect: boolean("outcome_correct"), // denormalized for stats
    exact: boolean("exact"),
    // Edit lifecycle: a saved prediction is fixed. Player requests an edit
    // (edit_requested_at), admin approves (edit_approved_at => grants ONE edit),
    // both clear on the next save.
    editRequestedAt: timestamp("edit_requested_at", { mode: "date" }),
    editApprovedAt: timestamp("edit_approved_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (p) => [
    unique("predictions_user_match_uq").on(p.userId, p.matchId),
    index("predictions_match_idx").on(p.matchId),
  ],
);

// ----------------------------------------------------------------------------
// App config (single row) + sync audit log
// ----------------------------------------------------------------------------
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  season: text("season").notNull().default("2026"),
  competitionCode: text("competition_code").notNull().default("WC"),
  pointsExact: integer("points_exact").notNull().default(3),
  pointsOutcome: integer("points_outcome").notNull().default(1),
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  syncProvider: text("sync_provider").notNull().default("footballData"),
});

export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  ranAt: timestamp("ran_at", { mode: "date" }).notNull().defaultNow(),
  source: text("source").notNull(),
  matchesUpdated: integer("matches_updated").notNull().default(0),
  acted: boolean("acted").notNull().default(false), // false => window gate skipped
  error: text("error"),
});

// ----------------------------------------------------------------------------
// Relations
// ----------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  predictions: many(predictions),
  authenticators: many(authenticators),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  homeMatches: many(matches, { relationName: "homeTeam" }),
  awayMatches: many(matches, { relationName: "awayTeam" }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: "homeTeam",
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: "awayTeam",
  }),
  winnerTeam: one(teams, {
    fields: [matches.winnerTeamId],
    references: [teams.id],
    relationName: "winnerTeam",
  }),
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, {
    fields: [predictions.userId],
    references: [users.id],
  }),
  match: one(matches, {
    fields: [predictions.matchId],
    references: [matches.id],
  }),
}));

// Convenience types
export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Stage = (typeof stageEnum.enumValues)[number];
export type MatchStatus = (typeof matchStatusEnum.enumValues)[number];
