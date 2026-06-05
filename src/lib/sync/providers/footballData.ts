import type { MatchStatus } from "@/db/schema";
import type { FootballProvider, MatchUpdate } from "../provider";

/**
 * football-data.org v4 provider (free tier covers the World Cup, code "WC").
 * Free-tier scores are delayed (not real-time) — acceptable for a prode.
 * Docs: https://www.football-data.org/documentation/quickstart
 */

interface FDTeam {
  id: number | null;
  name: string | null;
}
interface FDScorePart {
  home: number | null;
  away: number | null;
}
interface FDMatch {
  id: number;
  utcDate: string;
  status: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: {
    winner: string | null;
    duration: string;
    fullTime: FDScorePart; // regulation + extra time (no pens)
    halfTime: FDScorePart;
    penalties?: FDScorePart;
  };
}
interface FDResponse {
  matches: FDMatch[];
}

function mapStatus(s: string): MatchStatus {
  switch (s) {
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    case "POSTPONED":
    case "SUSPENDED":
      return "postponed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "scheduled"; // SCHEDULED, TIMED
  }
}

export const footballDataProvider: FootballProvider = {
  name: "footballData",
  async fetchMatches(competitionCode: string): Promise<MatchUpdate[]> {
    const token = process.env.FOOTBALL_DATA_TOKEN;
    if (!token) throw new Error("FOOTBALL_DATA_TOKEN no configurado");

    const res = await fetch(
      `https://api.football-data.org/v4/competitions/${competitionCode}/matches`,
      {
        headers: { "X-Auth-Token": token },
        cache: "no-store",
      },
    );
    if (!res.ok) {
      throw new Error(`football-data HTTP ${res.status}`);
    }
    const data = (await res.json()) as FDResponse;

    return data.matches
      .filter((m) => m.homeTeam?.name && m.awayTeam?.name)
      .map((m) => ({
        providerId: String(m.id),
        utcDate: m.utcDate,
        home: m.homeTeam.name as string,
        away: m.awayTeam.name as string,
        status: mapStatus(m.status),
        homeScore: m.score.fullTime?.home ?? null,
        awayScore: m.score.fullTime?.away ?? null,
        homePens: m.score.penalties?.home ?? null,
        awayPens: m.score.penalties?.away ?? null,
      }));
  },
};
