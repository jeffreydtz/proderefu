/**
 * Seed the database for Prode Mundial 2026.
 *
 * Idempotent — safe to re-run. Sources the fixture from openfootball
 * (worldcup.json, public domain). If the live fetch fails or returns too few
 * matches, falls back to a committed snapshot at
 * scripts/fixtures/worldcup-2026.json (drop the raw openfootball JSON there).
 *
 * Run with:  pnpm db:seed
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index";
import { invites, matches, settings, teams } from "../src/db/schema/index";
import { canonTeam } from "../src/lib/sync/normalize";
import {
  fetchOpenFootball,
  parseFixture,
  type ParsedFixture,
  type ParsedMatch,
} from "../src/lib/sync/openfootball";
import { APP_URL, OWNER_EMAIL } from "../src/lib/env";

const SNAPSHOT = path.resolve(
  process.cwd(),
  "scripts/fixtures/worldcup-2026.json",
);

async function loadFixture(): Promise<ParsedFixture> {
  try {
    const fx = await fetchOpenFootball();
    if (fx.matches.length >= 64) {
      console.log(
        `✓ openfootball: ${fx.teams.length} equipos, ${fx.matches.length} partidos`,
      );
      return fx;
    }
    console.warn(
      `⚠ openfootball devolvió solo ${fx.matches.length} partidos — intento snapshot…`,
    );
  } catch (e) {
    console.warn(`⚠ fetch openfootball falló (${(e as Error).message}) — intento snapshot…`);
  }

  // Fallback: committed snapshot of the raw openfootball worldcup.json.
  const raw = await readFile(SNAPSHOT, "utf8").catch(() => null);
  if (!raw) {
    throw new Error(
      `Sin fixture: el fetch falló y no existe ${SNAPSHOT}.\n` +
        `Descargá el JSON de openfootball/worldcup.json (2026) a esa ruta y reintentá.`,
    );
  }
  const fx = parseFixture(JSON.parse(raw));
  console.log(
    `✓ snapshot: ${fx.teams.length} equipos, ${fx.matches.length} partidos`,
  );
  return fx;
}

/** Re-derive per-group matchday 1..3 (openfootball uses tournament-wide rounds). */
function deriveGroupMatchdays(parsed: ParsedMatch[]): Map<number, number> {
  const md = new Map<number, number>();
  const byGroup = new Map<string, ParsedMatch[]>();
  for (const m of parsed) {
    if (m.stage !== "group" || !m.groupLetter) continue;
    const arr = byGroup.get(m.groupLetter);
    if (arr) arr.push(m);
    else byGroup.set(m.groupLetter, [m]);
  }
  for (const arr of byGroup.values()) {
    arr.sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
    arr.forEach((m, i) => md.set(m.seq, Math.min(3, Math.floor(i / 2) + 1)));
  }
  return md;
}

async function seedTeams(fx: ParsedFixture): Promise<Map<string, number>> {
  const values = fx.teams.map((t) => ({
    externalId: canonTeam(t.name),
    name: t.name,
    shortName: t.name,
    groupLetter: t.groupLetter,
  }));
  if (values.length) {
    await db.insert(teams).values(values).onConflictDoNothing();
  }
  const rows = await db
    .select({
      id: teams.id,
      externalId: teams.externalId,
      name: teams.name,
    })
    .from(teams);
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.externalId ?? canonTeam(r.name), r.id);
  }
  return map;
}

async function seedMatches(
  fx: ParsedFixture,
  idByCanon: Map<string, number>,
): Promise<number> {
  const mdBySeq = deriveGroupMatchdays(fx.matches);
  const values = fx.matches.map((m) => ({
    externalId: String(m.seq),
    stage: m.stage,
    groupLetter: m.groupLetter,
    matchday: m.stage === "group" ? (mdBySeq.get(m.seq) ?? null) : null,
    homeTeamId: m.homeIsTeam ? idByCanon.get(canonTeam(m.home)) ?? null : null,
    awayTeamId: m.awayIsTeam ? idByCanon.get(canonTeam(m.away)) ?? null : null,
    homePlaceholder: m.homeIsTeam ? null : m.home,
    awayPlaceholder: m.awayIsTeam ? null : m.away,
    kickoff: m.kickoff,
    venue: m.venue,
  }));
  if (!values.length) return 0;

  await db
    .insert(matches)
    .values(values)
    .onConflictDoUpdate({
      target: matches.externalId,
      // Update fixture metadata only — NEVER scores/status/locks, so manual
      // results survive a re-seed. coalesce keeps sync-resolved KO teams.
      set: {
        stage: sql`excluded.stage`,
        groupLetter: sql`excluded.group_letter`,
        matchday: sql`excluded.matchday`,
        homeTeamId: sql`coalesce(excluded.home_team_id, ${matches.homeTeamId})`,
        awayTeamId: sql`coalesce(excluded.away_team_id, ${matches.awayTeamId})`,
        homePlaceholder: sql`excluded.home_placeholder`,
        awayPlaceholder: sql`excluded.away_placeholder`,
        kickoff: sql`excluded.kickoff`,
        venue: sql`excluded.venue`,
        updatedAt: new Date(),
      },
    });
  return values.length;
}

async function seedSettings(): Promise<void> {
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
}

async function seedOwnerInvite(): Promise<void> {
  if (!OWNER_EMAIL) {
    console.warn("⚠ OWNER_EMAIL no seteado — no se creó invitación de admin.");
    return;
  }
  await db
    .insert(invites)
    .values({ email: OWNER_EMAIL, token: crypto.randomUUID() })
    .onConflictDoNothing();
  const inv = await db.query.invites.findFirst({
    where: eq(invites.email, OWNER_EMAIL),
  });
  if (inv) {
    console.log("\n👑 Invitación de admin:");
    console.log(`   ${APP_URL}/invite/${inv.token}`);
    console.log("   Abrila y registrá tu passkey (quedás como admin).\n");
  }
}

async function main() {
  const fx = await loadFixture();
  if (fx.matches.length < 104) {
    console.warn(
      `⚠ Solo ${fx.matches.length}/104 partidos. El fixture 2026 puede estar incompleto; re-ejecutá el seed cuando openfootball lo complete.`,
    );
  }
  const idByCanon = await seedTeams(fx);
  const n = await seedMatches(fx, idByCanon);
  await seedSettings();
  await seedOwnerInvite();
  console.log(`✓ Seed listo: ${idByCanon.size} equipos, ${n} partidos.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("✗ Seed falló:", e);
  process.exit(1);
});
