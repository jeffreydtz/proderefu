import { describe, expect, it } from "vitest";
import type { Team } from "@/db/schema";
import type { GroupTable } from "@/lib/standings/groups";
import { resolvePlaceholder, type ResolveContext } from "./bracket";

function team(id: number, name: string): Team {
  return { id, name } as unknown as Team;
}

const groupA: GroupTable = {
  letter: "A",
  rows: [
    { team: team(1, "Argentina") },
    { team: team(2, "Brasil") },
    { team: team(3, "Chile") },
    { team: team(4, "Perú") },
  ] as GroupTable["rows"],
};

const ctx: ResolveContext = {
  groupTables: new Map([["A", groupA]]),
  winnerBySeq: new Map([[73, team(9, "Francia")]]),
  loserBySeq: new Map([[101, team(8, "España")]]),
};

describe("resolvePlaceholder", () => {
  it("resolves group positions", () => {
    expect(resolvePlaceholder("1A", ctx).team?.id).toBe(1);
    expect(resolvePlaceholder("2A", ctx)).toMatchObject({
      label: "2A",
      team: { id: 2 },
    });
  });

  it("resolves winner/loser of a match seq", () => {
    expect(resolvePlaceholder("W73", ctx)).toMatchObject({
      label: "Ganador 73",
      team: { id: 9 },
    });
    expect(resolvePlaceholder("L101", ctx)).toMatchObject({
      label: "Perdedor 101",
      team: { id: 8 },
    });
  });

  it("labels best-third slots without guessing a team", () => {
    const r = resolvePlaceholder("3A/B/C/D", ctx);
    expect(r.team).toBeUndefined();
    expect(r.label).toBe("Mejor 3°");
  });

  it("handles unknown group / null gracefully", () => {
    expect(resolvePlaceholder("1Z", ctx).team).toBeUndefined();
    expect(resolvePlaceholder(null, ctx).label).toBe("Por definir");
  });
});
