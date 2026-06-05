import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import type { Match, Stage, Team } from "@/db/schema";
import { dayKey, formatDayHeading } from "@/lib/format";

export type MatchWithTeams = Match & {
  homeTeam: Team | null;
  awayTeam: Team | null;
};

export interface MatchDay {
  dayKey: string;
  heading: string;
  date: Date;
  matches: MatchWithTeams[];
}

/** All matches, chronological, with both teams joined (one query). */
export async function getAllMatches(): Promise<MatchWithTeams[]> {
  return db.query.matches.findMany({
    with: { homeTeam: true, awayTeam: true },
    orderBy: [asc(matches.kickoff)],
  });
}

/** Matches grouped by local day, in chronological order. */
export async function getMatchesByDay(): Promise<MatchDay[]> {
  const rows = await getAllMatches();
  const map = new Map<string, MatchWithTeams[]>();
  for (const m of rows) {
    const k = dayKey(m.kickoff);
    const list = map.get(k);
    if (list) list.push(m);
    else map.set(k, [m]);
  }
  return [...map.entries()].map(([k, ms]) => ({
    dayKey: k,
    heading: formatDayHeading(ms[0].kickoff),
    date: ms[0].kickoff,
    matches: ms,
  }));
}

/** Matches for a single local day key (yyyy-mm-dd). */
export async function getMatchesForDay(
  key: string,
): Promise<MatchWithTeams[]> {
  const rows = await getAllMatches();
  return rows.filter((m) => dayKey(m.kickoff) === key);
}

/** The day key of the next upcoming (still-open) match, else the last day. */
export async function getUpcomingDayKey(): Promise<string | null> {
  const rows = await getAllMatches();
  if (rows.length === 0) return null;
  const now = Date.now();
  const next =
    rows.find((m) => m.status === "scheduled" && m.kickoff.getTime() > now) ??
    rows.find((m) => m.kickoff.getTime() > now) ??
    rows[rows.length - 1];
  return dayKey(next.kickoff);
}

export async function getMatchesForStage(
  stage: Stage,
): Promise<MatchWithTeams[]> {
  return db.query.matches.findMany({
    where: eq(matches.stage, stage),
    with: { homeTeam: true, awayTeam: true },
    orderBy: [asc(matches.kickoff)],
  });
}
