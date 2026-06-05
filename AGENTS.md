<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent guide — Prode Mundial 2026

The block above is tool-managed (don't hand-edit it). Everything below captures the
live state, conventions, and gotchas that aren't obvious from the code alone — read it
before working in this repo.

## What this is

A **private** World Cup 2026 "prode" (score-prediction pool) for the owner + invited
friends. Single shared, closed pool — only the admin invites/accepts players; no public
self-signup. UI in Spanish (es-AR). Aesthetic: retro editorial deportivo (cream paper ·
ink · brick red · mustard gold · pitch green; Fraunces serif headings; Big Shoulders
tabular numbers), light **and** dark themes (toggle via next-themes).

Scoring: exact score = 3 pts, correct outcome = 1 pt, scored at 120′ (penalties don't
count). Tiebreak: points → exacts → outcomes → goal-diff error → name.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · shadcn/ui · Drizzle ORM +
postgres.js · **Supabase Postgres** · NextAuth v5 (passkeys/WebAuthn,
`@auth/drizzle-adapter`) · Vitest. Deployed on **Vercel**.

## Live infrastructure (as of 2026-06)

- **Production URL:** https://proderefu.vercel.app
- **Vercel:** project `proderefu` (`prj_czJh4payunWR2V8VpQG8CcO1uL22`), team
  `jeffreys-projects-591940ca` (`team_OSn9sZdjloF5qJ3XHWbOGpQV`). Git-connected to
  `github.com/jeffreydtz/proderefu` → **pushing to `main` auto-deploys production.**
- **Supabase:** project ref `glfcpxcnbyzvaofxdsjk` (region `aws-1-sa-east-1`). Schema
  applied + seeded (48 teams, 104 matches, settings row, owner invite).
- **Admin / `OWNER_EMAIL`:** `jef_dietz@hotmail.com` (auto-granted admin on first login).
  Note: the SMTP sender (`EMAIL_SERVER_USER`/`EMAIL_FROM`) is a separate Gmail
  (`jeffreydietz33@gmail.com`) — owner identity and mail sender are independent.

### How the DB is used (important)

The app talks to Postgres **directly** via Drizzle + postgres.js — it does **NOT** use the
Supabase client SDK, Supabase Auth, or PostgREST. So:

- Use the Supabase **transaction pooler** string (port 6543); `src/db/index.ts` sets
  `prepare: false`, which that pooler requires.
- **RLS is enabled on every public table with no policies.** The app connects as the
  `postgres` owner role (bypasses RLS), so it's unaffected; this only closes the public
  PostgREST/anon hole (the repo is public). If you add a table, enable RLS on it too —
  `get_advisors` (Supabase MCP) will flag it.
- Drizzle migrations live in `drizzle/`; they were applied to Supabase via the Supabase
  MCP `apply_migration`. Locally, `pnpm db:push` works against the pooled `DATABASE_URL`.

## Environment variables

Set in Vercel (production) and in `.env.local` for local dev. `.env*` is **gitignored** —
never commit secrets. `.env.vercel` (gitignored) holds the production values consumed by
`scripts/setup-vercel-env.sh`.

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase **transaction pooler** string (port 6543). Required. |
| `AUTH_SECRET` | NextAuth secret (`npx auth secret`). Required. |
| `NEXT_PUBLIC_APP_URL` / `AUTH_URL` | Public base URL. **Passkeys (WebAuthn rpID) are bound to this hostname** — keep it stable. |
| `WEBAUTHN_RP_ID` / `WEBAUTHN_RP_NAME` | Optional WebAuthn overrides (rpID defaults to the APP_URL hostname). |
| `OWNER_EMAIL` | Bootstrap admin email. |
| `CRON_SECRET` | Bearer token for `/api/cron/*`. Vercel Cron injects it automatically. |
| `FOOTBALL_DATA_TOKEN` | football-data.org v4 token (live scores). Free tier covers WC. |
| `EMAIL_SERVER_*`, `EMAIL_FROM` | Gmail SMTP (invites + reminder emails). |

## Deploy / env management

The Vercel CLI is authenticated as `jeffreydtz`; the repo is linked (`.vercel/`, gitignored).

```bash
bash scripts/setup-vercel-env.sh   # push every KEY=VALUE in .env.vercel to Vercel prod
git push origin main               # auto git-deploy (env must already be set)
npx vercel --prod                  # OR deploy the local working tree directly
```

A failed deploy is almost always a missing env var — `src/db/index.ts` throws at import
when `DATABASE_URL` is unset, which fails the build's page-data collection.

## Local dev

```bash
pnpm install
cp .env.example .env.local   # fill DATABASE_URL (pooler), AUTH_SECRET, OWNER_EMAIL...
pnpm db:push && pnpm db:seed # only when pointing at a fresh DB
pnpm dev
```

`pnpm db:seed` prints an `/invite/<token>` link → open it, register a passkey, you're admin.

## Branding & icons (code-generated — no binary assets)

Everything derives from `src/lib/brand.ts` (palette + the geometric "P" mark SVG) via Next
file conventions + `next/og`: `app/icon.svg` (favicon), `app/apple-icon.tsx`,
`app/icons/app/route.tsx` (512 maskable PWA), `app/opengraph-image.tsx`,
`app/twitter-image.tsx`, `app/manifest.ts`. In-app lockup:
`src/components/retro/brand-logo.tsx`. **Read the `app-icons` skill**
(`.claude/skills/app-icons/`) before changing any logo/icon — it documents the system and
the Satori/`next/og` gotchas (hex colors only, no `<text>` in the mark, etc.).

## Mobile / UX conventions

The UI is mobile-first. When adding UI, keep:

- **Touch targets ≥ 44px.** `Button size="lg"` is 44px; icon buttons use
  `size="icon" className="size-11 md:size-9"`. Tappable non-buttons need `min-h-11`.
- **Safe areas:** global utilities `safe-x`, `safe-top`, `safe-bottom` (notch /
  home-indicator; `viewport-fit=cover` is set). The shell applies them already.
- **No iOS focus zoom:** form controls are ≥16px on mobile (global rule in `globals.css`);
  add `inputMode="numeric" pattern="[0-9]*"` to score inputs.
- **No real info below `text-xs` (12px);** body prefers `text-sm`. Don't use `.eyebrow`
  (uppercase tracked 12px) for substantive copy.
- `FlagName` truncates internally — parent flex/grid cells need `min-w-0` for it to engage.
- Tappable elements get `active:` feedback + `aria-current="page"` for selected chips.

## Crons

- `vercel.json` schedules the daily `/api/cron/keepalive` (full reconcile; Vercel injects
  the `CRON_SECRET` Bearer).
- Hobby plan = 1 cron/day, so match-window live scores + reminders run via external
  **cron-job.org** hitting `/api/cron/sync` (`*/5`) and `/api/cron/reminders` (hourly)
  with header `Authorization: Bearer <CRON_SECRET>`. `runSync` self-gates to match windows.

## Architecture

- `src/app/(app)/` — authenticated app (tabla, pronosticos, partidos, grupos, llave,
  perfil) + `admin/`. `src/app/login`, `src/app/invite/[token]` — auth entry.
- `src/lib/scoring/`, `src/lib/standings/`, `src/lib/bracket*.ts`, `src/lib/stats*.ts` —
  pure logic + DB services (unit-tested).
- `src/lib/sync/` — window-gated score sync + openfootball parser.
- `src/db/schema/` — Drizzle schema (source of truth for tables).
- `src/components/retro/` — the retro editorial design system.

## Testing

`pnpm test` (Vitest) covers scoring, standings, bracket, stats, prediction locks — pure
logic, no DB needed. `pnpm lint` for ESLint. Run both before pushing.
