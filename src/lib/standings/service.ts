import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches } from "@/db/schema";
import type { MatchWithTeams } from "@/lib/queries/matches";
import { getTeamsByGroup } from "@/lib/queries/teams";
import { buildGroupTable, cmpOverall, type GroupRow, type GroupTable } from "./groups";

export async function getGroupTables(): Promise<GroupTable[]> {
  const teamsByGroup = await getTeamsByGroup();
  const groupMatches = (await db.query.matches.findMany({
    where: eq(matches.stage, "group"),
    with: { homeTeam: true, awayTeam: true },
  })) as MatchWithTeams[];

  const byLetter = new Map<string, MatchWithTeams[]>();
  for (const m of groupMatches) {
    if (!m.groupLetter) continue;
    const arr = byLetter.get(m.groupLetter);
    if (arr) arr.push(m);
    else byLetter.set(m.groupLetter, [m]);
  }

  const tables: GroupTable[] = [];
  for (const [letter, teams] of teamsByGroup) {
    tables.push(buildGroupTable(letter, teams, byLetter.get(letter) ?? []));
  }
  return tables;
}

/** Third-placed teams ranked best→worst (8 of 12 advance in 2026). */
export async function getThirdPlacedRanking(): Promise<
  { letter: string; row: GroupRow }[]
> {
  const tables = await getGroupTables();
  const thirds = tables
    .map((t) => ({ letter: t.letter, row: t.rows[2] }))
    .filter((x): x is { letter: string; row: GroupRow } => Boolean(x.row));
  thirds.sort((a, b) => cmpOverall(a.row, b.row));
  return thirds;
}
