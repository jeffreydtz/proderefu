import "server-only";
import type { Stage, Team } from "@/db/schema";
import { getAllMatches } from "@/lib/queries/matches";
import { getTeams } from "@/lib/queries/teams";
import { getGroupTables } from "@/lib/standings/service";
import {
  KO_STAGES,
  toSlot,
  type BracketSlot,
  type ResolveContext,
} from "./bracket";

export interface BracketRound {
  stage: Stage;
  slots: BracketSlot[];
}

export async function buildBracket(): Promise<BracketRound[]> {
  const [all, teamsList, groupTables] = await Promise.all([
    getAllMatches(),
    getTeams(),
    getGroupTables(),
  ]);

  const teamsById = new Map(teamsList.map((t) => [t.id, t]));
  const groupMap = new Map(groupTables.map((t) => [t.letter, t]));
  const winnerBySeq = new Map<number, Team>();
  const loserBySeq = new Map<number, Team>();

  for (const m of all) {
    if (!m.externalId) continue;
    const seq = Number(m.externalId);
    if (Number.isNaN(seq)) continue;
    if (m.status === "finished" && m.winnerTeamId) {
      const w = teamsById.get(m.winnerTeamId);
      if (w) winnerBySeq.set(seq, w);
      const loserId =
        m.homeTeamId === m.winnerTeamId ? m.awayTeamId : m.homeTeamId;
      if (loserId) {
        const l = teamsById.get(loserId);
        if (l) loserBySeq.set(seq, l);
      }
    }
  }

  const ctx: ResolveContext = { groupTables: groupMap, winnerBySeq, loserBySeq };
  const rounds: BracketRound[] = [];
  for (const stage of KO_STAGES) {
    const slots = all.filter((m) => m.stage === stage).map((m) => toSlot(m, ctx));
    if (slots.length) rounds.push({ stage, slots });
  }
  return rounds;
}
