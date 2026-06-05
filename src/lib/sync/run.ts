import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches as matchesTable, syncLog } from "@/db/schema";
import { scoreMatch } from "@/lib/scoring/service";
import { winnerOf } from "@/lib/match-result";
import { matchSignature, utcDateKey } from "./normalize";
import { getProvider } from "./providers";
import type { MatchUpdate } from "./provider";

const WINDOW_BEFORE_MS = 3 * 60 * 60 * 1000; // 3h before kickoff
const WINDOW_AFTER_MS = 15 * 60 * 1000; // 15 min grace (so off-window runs no-op)

export interface SyncResult {
  acted: boolean;
  updated: number;
  error?: string;
}

/**
 * Pull the latest scores from the configured provider and apply them.
 * - Window-gated: no-ops unless a match is around "now" (saves API calls + DB
 *   compute when the 5-min cron fires outside match windows).
 * - Never overwrites matches with `manual_locked = true`.
 * - Recomputes points (idempotent) for matches that change to finished.
 */
export async function runSync(
  source: string,
  force = false,
): Promise<SyncResult> {
  try {
    const setting = await db.query.settings.findFirst();
    if (setting && !setting.syncEnabled) {
      await writeLog(source, false, 0);
      return { acted: false, updated: 0 };
    }

    const locals = await db.query.matches.findMany({
      with: { homeTeam: true, awayTeam: true },
    });

    const now = Date.now();
    const inWindow = locals.some((m) => {
      if (m.status === "live") return true;
      const k = m.kickoff.getTime();
      return k <= now + WINDOW_AFTER_MS && k >= now - WINDOW_BEFORE_MS;
    });
    if (!force && !inWindow) {
      await writeLog(source, false, 0);
      return { acted: false, updated: 0 };
    }

    const provider = getProvider(setting?.syncProvider ?? "footballData");
    const updates = await provider.fetchMatches(
      setting?.competitionCode ?? "WC",
    );

    const bySig = new Map<string, MatchUpdate>();
    for (const u of updates) {
      bySig.set(matchSignature(utcDateKey(u.utcDate), u.home, u.away), u);
    }

    let updated = 0;
    for (const m of locals) {
      if (m.manualLocked) continue;
      if (!m.homeTeam?.name || !m.awayTeam?.name) continue; // unresolved KO slot

      const sig = matchSignature(
        utcDateKey(m.kickoff),
        m.homeTeam.name,
        m.awayTeam.name,
      );
      const u = bySig.get(sig);
      if (!u) continue;

      const changed =
        m.status !== u.status ||
        m.homeScore !== u.homeScore ||
        m.awayScore !== u.awayScore ||
        m.homePens !== u.homePens ||
        m.awayPens !== u.awayPens;
      if (!changed) continue;

      const finished = u.status === "finished";
      const winnerTeamId =
        finished && u.homeScore != null && u.awayScore != null
          ? winnerOf(
              m.homeTeamId!,
              m.awayTeamId!,
              u.homeScore,
              u.awayScore,
              u.homePens,
              u.awayPens,
            )
          : null;

      await db
        .update(matchesTable)
        .set({
          status: u.status,
          homeScore: u.homeScore,
          awayScore: u.awayScore,
          homePens: u.homePens,
          awayPens: u.awayPens,
          winnerTeamId,
          scoreSource: "api",
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(matchesTable.id, m.id));

      if (finished) {
        await scoreMatch(m.id);
      }
      updated++;
    }

    await writeLog(source, true, updated);
    return { acted: true, updated };
  } catch (e) {
    const error = (e as Error).message;
    await writeLog(source, true, 0, error);
    return { acted: true, updated: 0, error };
  }
}

async function writeLog(
  source: string,
  acted: boolean,
  matchesUpdated: number,
  error?: string,
) {
  try {
    await db.insert(syncLog).values({ source, acted, matchesUpdated, error });
  } catch {
    // logging must never break the sync response
  }
}
