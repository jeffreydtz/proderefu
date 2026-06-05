import type { Stage } from "@/db/schema";

/**
 * Parser for openfootball/worldcup.json (public domain, no API key).
 * The 2026 file shape:
 *   { name, matches: [{ round, num?, date, time:"13:00 UTC-6", team1, team2,
 *                       group?:"Group A", ground }] }
 * Group matches use real team names; knockout matches use placeholders like
 * "1A", "2B", "3A/B/C/D/F", "W73", "L101".
 */

export const DEFAULT_OPENFOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

interface RawMatch {
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
}

interface RawFixture {
  name: string;
  matches: RawMatch[];
}

export interface ParsedTeam {
  name: string;
  groupLetter: string | null;
}

export interface ParsedMatch {
  seq: number; // stable position in the file → internal externalId
  stage: Stage;
  matchday: number | null;
  groupLetter: string | null;
  kickoff: Date;
  venue: string | null;
  home: string;
  away: string;
  homeIsTeam: boolean;
  awayIsTeam: boolean;
}

export interface ParsedFixture {
  teams: ParsedTeam[];
  matches: ParsedMatch[];
}

/** A value is a knockout placeholder, not a real team name. */
export function isPlaceholder(value: string): boolean {
  return (
    /^\d[A-L]$/.test(value) || // 1A, 2B (group winner/runner-up)
    /^3[A-Z/]+$/.test(value) || // 3A/B/C/D/F (best third combos)
    /^[WL]\d+$/.test(value) // W73 (winner of), L101 (loser of)
  );
}

function parseKickoff(date: string, time: string): Date {
  const [hm, tz] = time.split(" ");
  const m = tz?.match(/UTC([+-])(\d{1,2})(?::?(\d{2}))?/);
  const sign = m?.[1] ?? "+";
  const hh = (m?.[2] ?? "0").padStart(2, "0");
  const mm = (m?.[3] ?? "00").padStart(2, "0");
  const offset = `${sign}${hh}:${mm}`;
  const d = new Date(`${date}T${hm}:00${offset}`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`No se pudo parsear la fecha: ${date} ${time}`);
  }
  return d;
}

function parseRound(round: string): { stage: Stage; matchday: number | null } {
  const md = round.match(/^Matchday (\d+)$/);
  if (md) return { stage: "group", matchday: Number(md[1]) };
  switch (round) {
    case "Round of 32":
      return { stage: "round_of_32", matchday: null };
    case "Round of 16":
      return { stage: "round_of_16", matchday: null };
    case "Quarter-final":
      return { stage: "quarter", matchday: null };
    case "Semi-final":
      return { stage: "semi", matchday: null };
    case "Match for third place":
      return { stage: "third_place", matchday: null };
    case "Final":
      return { stage: "final", matchday: null };
    default:
      throw new Error(`Ronda desconocida: ${round}`);
  }
}

function groupLetter(group: string | undefined): string | null {
  if (!group) return null;
  const m = group.match(/Group ([A-L])/);
  return m ? m[1] : null;
}

export function parseFixture(raw: RawFixture): ParsedFixture {
  const teamsMap = new Map<string, ParsedTeam>();
  const matches: ParsedMatch[] = [];

  raw.matches.forEach((rm, index) => {
    const { stage, matchday } = parseRound(rm.round);
    const gl = groupLetter(rm.group);
    const homeIsTeam = !isPlaceholder(rm.team1);
    const awayIsTeam = !isPlaceholder(rm.team2);

    if (stage === "group") {
      if (homeIsTeam) registerTeam(teamsMap, rm.team1, gl);
      if (awayIsTeam) registerTeam(teamsMap, rm.team2, gl);
    }

    matches.push({
      seq: index + 1,
      stage,
      matchday,
      groupLetter: gl,
      kickoff: parseKickoff(rm.date, rm.time),
      venue: rm.ground ?? null,
      home: rm.team1,
      away: rm.team2,
      homeIsTeam,
      awayIsTeam,
    });
  });

  return { teams: [...teamsMap.values()], matches };
}

function registerTeam(
  map: Map<string, ParsedTeam>,
  name: string,
  gl: string | null,
) {
  const existing = map.get(name);
  if (existing) {
    if (!existing.groupLetter && gl) existing.groupLetter = gl;
    return;
  }
  map.set(name, { name, groupLetter: gl });
}

export async function fetchOpenFootball(url?: string): Promise<ParsedFixture> {
  const target = url ?? process.env.OPENFOOTBALL_URL ?? DEFAULT_OPENFOOTBALL_URL;
  const res = await fetch(target, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`openfootball fetch falló: HTTP ${res.status}`);
  }
  const raw = (await res.json()) as RawFixture;
  return parseFixture(raw);
}
