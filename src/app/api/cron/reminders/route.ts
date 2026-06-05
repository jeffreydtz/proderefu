import { NextResponse } from "next/server";
import { and, gt, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { APP_URL } from "@/lib/env";
import { emailConfigured, sendDeadlineReminder } from "@/lib/mail";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WINDOW_MS = 3 * 60 * 60 * 1000; // remind for matches kicking off within 3h

/**
 * Emails players who haven't predicted matches starting soon. Idempotency is
 * best-effort (no per-send log) — run hourly so each match window is hit ~1–3×.
 * Authorize with the same CRON_SECRET Bearer as the other cron routes.
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!emailConfigured) {
    return NextResponse.json({ ok: true, skipped: "email no configurado" });
  }

  const now = new Date();
  const soon = new Date(now.getTime() + WINDOW_MS);
  const upcoming = await db.query.matches.findMany({
    where: and(
      gt(matches.kickoff, now),
      lt(matches.kickoff, soon),
    ),
    columns: { id: true, status: true },
  });
  const openIds = upcoming.filter((m) => m.status === "scheduled").map((m) => m.id);
  if (openIds.length === 0) {
    return NextResponse.json({ ok: true, reminded: 0, matches: 0 });
  }

  const [players, preds] = await Promise.all([
    db.query.users.findMany({ columns: { id: true, email: true } }),
    db.query.predictions.findMany({
      where: inArray(predictions.matchId, openIds),
      columns: { userId: true, matchId: true },
    }),
  ]);

  const predByUser = new Map<string, Set<number>>();
  for (const p of preds) {
    const set = predByUser.get(p.userId) ?? new Set<number>();
    set.add(p.matchId);
    predByUser.set(p.userId, set);
  }

  let reminded = 0;
  for (const u of players) {
    if (!u.email) continue;
    const have = predByUser.get(u.id) ?? new Set<number>();
    const missing = openIds.filter((id) => !have.has(id)).length;
    if (missing === 0) continue;
    const sent = await sendDeadlineReminder(u.email, {
      count: missing,
      url: `${APP_URL}/pronosticos`,
    }).catch(() => false);
    if (sent) reminded++;
  }

  return NextResponse.json({ ok: true, reminded, matches: openIds.length });
}

export const POST = GET;
