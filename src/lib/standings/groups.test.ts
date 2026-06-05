import { describe, expect, it } from "vitest";
import type { Team } from "@/db/schema";
import type { MatchWithTeams } from "@/lib/queries/matches";
import { buildGroupTable } from "./groups";

function team(id: number, name: string): Team {
  return { id, name } as unknown as Team;
}

function m(
  homeTeamId: number,
  awayTeamId: number,
  homeScore: number,
  awayScore: number,
  status = "finished",
): MatchWithTeams {
  return {
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    status,
    groupLetter: "X",
  } as unknown as MatchWithTeams;
}

describe("buildGroupTable", () => {
  it("awards 3/1/0 and orders by points → GD → GF", () => {
    const teams = [team(1, "Argentina"), team(2, "Brasil"), team(3, "Chile")];
    const matches = [
      m(1, 3, 2, 0), // ARG beats CHI
      m(2, 3, 1, 0), // BRA beats CHI
      m(1, 2, 0, 0), // ARG draw BRA
    ];
    const t = buildGroupTable("X", teams, matches);
    expect(t.rows.map((r) => r.team.id)).toEqual([1, 2, 3]);
    expect(t.rows[0]).toMatchObject({ points: 4, gd: 2, rank: 1 });
    expect(t.rows[1]).toMatchObject({ points: 4, gd: 1, rank: 2 });
    expect(t.rows[2]).toMatchObject({ points: 0, rank: 3 });
  });

  it("breaks an exact tie (points, GD, GF) by head-to-head", () => {
    // A and B both finish 3pts / GD 0 / GF 2, but A beat B 2-0.
    const teams = [team(1, "A"), team(2, "B"), team(3, "C"), team(4, "D")];
    const matches = [
      m(1, 2, 2, 0), // A beats B (decisive h2h)
      m(1, 3, 0, 2), // A loses to C
      m(2, 4, 2, 0), // B beats D
    ];
    const t = buildGroupTable("X", teams, matches);
    // C tops (GD +2); then the A/B tie resolved by h2h → A above B.
    expect(t.rows.map((r) => r.team.id)).toEqual([3, 1, 2, 4]);
    expect(t.rows[1].team.id).toBe(1);
    expect(t.rows[1].rank).toBe(2);
    expect(t.rows[2].team.id).toBe(2);
    expect(t.rows[2].rank).toBe(3);
  });

  it("ignores matches that are not finished", () => {
    const teams = [team(1, "A"), team(2, "B")];
    const t = buildGroupTable("X", teams, [m(1, 2, 5, 0, "scheduled")]);
    expect(t.rows.every((r) => r.played === 0 && r.points === 0)).toBe(true);
  });
});
