import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { teams } from "@/db/schema";
import type { Team } from "@/db/schema";

export async function getTeams(): Promise<Team[]> {
  return db.query.teams.findMany({ orderBy: [asc(teams.name)] });
}

/** Teams grouped by group letter A..L (only teams with a group). */
export async function getTeamsByGroup(): Promise<Map<string, Team[]>> {
  const all = await getTeams();
  const map = new Map<string, Team[]>();
  for (const t of all) {
    if (!t.groupLetter) continue;
    const arr = map.get(t.groupLetter);
    if (arr) arr.push(t);
    else map.set(t.groupLetter, [t]);
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}
