import type { Team } from "@/db/schema";
import type { MatchWithTeams } from "@/lib/queries/matches";

// Pure group-standings logic. No DB / no I/O so it is unit-testable.

export interface GroupRow {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  rank: number;
}

export interface GroupTable {
  letter: string;
  rows: GroupRow[];
}

function blankRow(team: Team): GroupRow {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    rank: 0,
  };
}

export function isCountable(m: MatchWithTeams): boolean {
  return (
    m.status === "finished" &&
    m.homeTeamId != null &&
    m.awayTeamId != null &&
    m.homeScore != null &&
    m.awayScore != null
  );
}

/** Overall comparator: points → GD → GF → name (es). */
export function cmpOverall(a: GroupRow, b: GroupRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.gd !== a.gd) return b.gd - a.gd;
  if (b.gf !== a.gf) return b.gf - a.gf;
  return a.team.name.localeCompare(b.team.name, "es");
}

/** Mini-table over only the matches played among `ids`. */
function headToHead(
  ids: Set<number>,
  finished: MatchWithTeams[],
): Map<number, { points: number; gd: number; gf: number }> {
  const t = new Map<number, { points: number; gd: number; gf: number }>();
  for (const id of ids) t.set(id, { points: 0, gd: 0, gf: 0 });
  for (const m of finished) {
    const h = m.homeTeamId!;
    const a = m.awayTeamId!;
    if (!ids.has(h) || !ids.has(a)) continue;
    const hs = m.homeScore!;
    const as = m.awayScore!;
    const th = t.get(h)!;
    const ta = t.get(a)!;
    th.gf += hs;
    th.gd += hs - as;
    ta.gf += as;
    ta.gd += as - hs;
    if (hs > as) th.points += 3;
    else if (as > hs) ta.points += 3;
    else {
      th.points += 1;
      ta.points += 1;
    }
  }
  return t;
}

function breakTies(ordered: GroupRow[], finished: MatchWithTeams[]): GroupRow[] {
  const result: GroupRow[] = [];
  let i = 0;
  while (i < ordered.length) {
    let j = i + 1;
    while (
      j < ordered.length &&
      ordered[j].points === ordered[i].points &&
      ordered[j].gd === ordered[i].gd &&
      ordered[j].gf === ordered[i].gf
    ) {
      j++;
    }
    const cluster = ordered.slice(i, j);
    if (cluster.length > 1) {
      const ids = new Set(cluster.map((r) => r.team.id));
      const h2h = headToHead(ids, finished);
      cluster.sort((a, b) => {
        const ha = h2h.get(a.team.id)!;
        const hb = h2h.get(b.team.id)!;
        if (hb.points !== ha.points) return hb.points - ha.points;
        if (hb.gd !== ha.gd) return hb.gd - ha.gd;
        if (hb.gf !== ha.gf) return hb.gf - ha.gf;
        return a.team.name.localeCompare(b.team.name, "es");
      });
    }
    result.push(...cluster);
    i = j;
  }
  return result;
}

/**
 * Build a group standings table from that group's matches.
 *
 * FIFA 2026 order: points → overall GD → overall GF → head-to-head
 * (points, GD, GF among the still-tied teams) → name (lots not modeled).
 */
export function buildGroupTable(
  letter: string,
  teams: Team[],
  groupMatches: MatchWithTeams[],
): GroupTable {
  const finished = groupMatches.filter(isCountable);
  const rows = new Map<number, GroupRow>();
  for (const t of teams) rows.set(t.id, blankRow(t));

  for (const m of finished) {
    const home = rows.get(m.homeTeamId!);
    const away = rows.get(m.awayTeamId!);
    if (!home || !away) continue;
    const hs = m.homeScore!;
    const as = m.awayScore!;
    home.played++;
    away.played++;
    home.gf += hs;
    home.ga += as;
    away.gf += as;
    away.ga += hs;
    if (hs > as) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (as > hs) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  const ordered = [...rows.values()];
  for (const r of ordered) r.gd = r.gf - r.ga;
  ordered.sort(cmpOverall);

  const resolved = breakTies(ordered, finished);
  resolved.forEach((r, i) => (r.rank = i + 1));
  return { letter, rows: resolved };
}
