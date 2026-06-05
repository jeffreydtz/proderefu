import type { MatchStatus, Stage, Team } from "@/db/schema";
import type { MatchWithTeams } from "@/lib/queries/matches";
import type { GroupTable } from "@/lib/standings/groups";

// Pure knockout-bracket resolution. No DB — unit-testable.

export interface ResolvedSide {
  team?: Team;
  /** Human label shown when the team isn't known yet ("1A", "Ganador 73"). */
  label: string;
}

export interface ResolveContext {
  groupTables: Map<string, GroupTable>;
  winnerBySeq: Map<number, Team>;
  loserBySeq: Map<number, Team>;
}

export interface BracketSlot {
  matchId: number;
  seq: number | null;
  stage: Stage;
  kickoff: Date;
  status: MatchStatus;
  home: ResolvedSide;
  away: ResolvedSide;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
  winnerTeamId: number | null;
}

export const KO_STAGES: Stage[] = [
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
];

/**
 * Resolve a knockout placeholder to a team when known:
 *  - "1A" / "2B" → group position (from group tables)
 *  - "W73" / "L101" → winner / loser of the match with that seq (externalId)
 *  - "3A/B/C/..." → best-third slot; not derivable from standings alone in 2026,
 *    so we render a label until sync/admin fills the real team.
 */
export function resolvePlaceholder(
  ph: string | null | undefined,
  ctx: ResolveContext,
): ResolvedSide {
  if (!ph) return { label: "Por definir" };

  const grp = ph.match(/^([12])([A-L])$/);
  if (grp) {
    const pos = Number(grp[1]);
    const letter = grp[2];
    const team = ctx.groupTables.get(letter)?.rows[pos - 1]?.team;
    return { label: ph, team };
  }

  const wl = ph.match(/^([WL])(\d+)$/);
  if (wl) {
    const seq = Number(wl[2]);
    const team =
      wl[1] === "W" ? ctx.winnerBySeq.get(seq) : ctx.loserBySeq.get(seq);
    return {
      label: wl[1] === "W" ? `Ganador ${seq}` : `Perdedor ${seq}`,
      team,
    };
  }

  if (/^3/.test(ph)) return { label: "Mejor 3°" };
  return { label: ph };
}

export function resolveSide(
  m: MatchWithTeams,
  side: "home" | "away",
  ctx: ResolveContext,
): ResolvedSide {
  const team = side === "home" ? m.homeTeam : m.awayTeam;
  if (team) return { team, label: team.shortName || team.name };
  const ph = side === "home" ? m.homePlaceholder : m.awayPlaceholder;
  return resolvePlaceholder(ph, ctx);
}

export function toSlot(m: MatchWithTeams, ctx: ResolveContext): BracketSlot {
  const parsed = m.externalId ? Number(m.externalId) : null;
  return {
    matchId: m.id,
    seq: parsed === null || Number.isNaN(parsed) ? null : parsed,
    stage: m.stage,
    kickoff: m.kickoff,
    status: m.status,
    home: resolveSide(m, "home", ctx),
    away: resolveSide(m, "away", ctx),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homePens: m.homePens,
    awayPens: m.awayPens,
    winnerTeamId: m.winnerTeamId,
  };
}
