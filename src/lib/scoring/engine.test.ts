import { describe, expect, it } from "vitest";
import {
  DEFAULT_SCORING,
  goalDiffError,
  rankStandings,
  scorePrediction,
  sign,
  type StandingInput,
} from "./engine";

describe("scorePrediction", () => {
  it("exact score => 3 pts, exact + outcome true", () => {
    expect(
      scorePrediction({ predHome: 2, predAway: 1, actualHome: 2, actualAway: 1 }),
    ).toEqual({ points: 3, exact: true, outcomeCorrect: true });
  });

  it("exact draw => 3 pts", () => {
    expect(
      scorePrediction({ predHome: 0, predAway: 0, actualHome: 0, actualAway: 0 }),
    ).toEqual({ points: 3, exact: true, outcomeCorrect: true });
  });

  it("correct home-win outcome, wrong score => 1 pt", () => {
    expect(
      scorePrediction({ predHome: 2, predAway: 0, actualHome: 3, actualAway: 1 }),
    ).toEqual({ points: 1, exact: false, outcomeCorrect: true });
  });

  it("correct away-win outcome, wrong score => 1 pt", () => {
    expect(
      scorePrediction({ predHome: 0, predAway: 2, actualHome: 1, actualAway: 3 }),
    ).toEqual({ points: 1, exact: false, outcomeCorrect: true });
  });

  it("correct draw outcome, wrong score => 1 pt", () => {
    expect(
      scorePrediction({ predHome: 1, predAway: 1, actualHome: 2, actualAway: 2 }),
    ).toEqual({ points: 1, exact: false, outcomeCorrect: true });
  });

  it("wrong outcome => 0 pts", () => {
    expect(
      scorePrediction({ predHome: 2, predAway: 0, actualHome: 0, actualAway: 1 }),
    ).toEqual({ points: 0, exact: false, outcomeCorrect: false });
  });

  it("predicted draw but home won => 0 pts", () => {
    expect(
      scorePrediction({ predHome: 1, predAway: 1, actualHome: 2, actualAway: 0 }),
    ).toEqual({ points: 0, exact: false, outcomeCorrect: false });
  });

  it("knockout decided on penalties is scored as the 120' draw", () => {
    // Match ended 1-1 after ET, won 4-2 on pens. Caller passes the 120' score.
    // A player who predicted a 1-1 draw gets the EXACT points; pens are ignored.
    expect(
      scorePrediction({ predHome: 1, predAway: 1, actualHome: 1, actualAway: 1 }),
    ).toEqual({ points: 3, exact: true, outcomeCorrect: true });
    // A player who predicted "home wins 2-1" gets 0 — it was a draw in 120'.
    expect(
      scorePrediction({ predHome: 2, predAway: 1, actualHome: 1, actualAway: 1 }),
    ).toEqual({ points: 0, exact: false, outcomeCorrect: false });
  });

  it("respects a custom scoring config", () => {
    const cfg = { exact: 5, outcome: 2 };
    expect(
      scorePrediction(
        { predHome: 1, predAway: 0, actualHome: 1, actualAway: 0 },
        cfg,
      ).points,
    ).toBe(5);
    expect(
      scorePrediction(
        { predHome: 1, predAway: 0, actualHome: 3, actualAway: 1 },
        cfg,
      ).points,
    ).toBe(2);
  });

  it("default config is 3 / 1", () => {
    expect(DEFAULT_SCORING).toEqual({ exact: 3, outcome: 1 });
  });
});

describe("sign", () => {
  it("classifies outcomes", () => {
    expect(sign(2)).toBe(1);
    expect(sign(-3)).toBe(-1);
    expect(sign(0)).toBe(0);
  });
});

describe("goalDiffError", () => {
  it("0 when goal difference matches", () => {
    expect(
      goalDiffError({ predHome: 2, predAway: 0, actualHome: 3, actualAway: 1 }),
    ).toBe(0);
  });
  it("absolute difference of goal differences", () => {
    expect(
      goalDiffError({ predHome: 3, predAway: 0, actualHome: 1, actualAway: 1 }),
    ).toBe(3); // pred diff +3, actual diff 0 => |3-0|
  });
});

describe("rankStandings", () => {
  const base = (over: Partial<StandingInput>): StandingInput => ({
    userId: over.userId ?? "u",
    displayName: over.displayName ?? "User",
    points: over.points ?? 0,
    exactHits: over.exactHits ?? 0,
    outcomeHits: over.outcomeHits ?? 0,
    gdError: over.gdError ?? 0,
    scoredCount: over.scoredCount ?? 0,
  });

  it("orders by points desc", () => {
    const ranked = rankStandings([
      base({ userId: "a", displayName: "Ana", points: 5 }),
      base({ userId: "b", displayName: "Beto", points: 9 }),
      base({ userId: "c", displayName: "Cati", points: 7 }),
    ]);
    expect(ranked.map((r) => r.userId)).toEqual(["b", "c", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks point-ties by exact hits, then outcome hits", () => {
    const ranked = rankStandings([
      base({ userId: "a", displayName: "Ana", points: 9, exactHits: 1, outcomeHits: 6 }),
      base({ userId: "b", displayName: "Beto", points: 9, exactHits: 3, outcomeHits: 0 }),
      base({ userId: "c", displayName: "Cati", points: 9, exactHits: 1, outcomeHits: 6, gdError: 2 }),
    ]);
    // b has most exacts -> 1st; a and c tie on points+exacts+outcomes, a has lower gdError
    expect(ranked.map((r) => r.userId)).toEqual(["b", "a", "c"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("assigns shared ranks when fully tied through tiebreaker 4", () => {
    const ranked = rankStandings([
      base({ userId: "a", displayName: "Ana", points: 6, exactHits: 2, outcomeHits: 0, gdError: 1 }),
      base({ userId: "b", displayName: "Beto", points: 6, exactHits: 2, outcomeHits: 0, gdError: 1 }),
      base({ userId: "c", displayName: "Cati", points: 3 }),
    ]);
    expect(ranked.find((r) => r.userId === "a")?.rank).toBe(1);
    expect(ranked.find((r) => r.userId === "b")?.rank).toBe(1);
    expect(ranked.find((r) => r.userId === "a")?.tied).toBe(true);
    expect(ranked.find((r) => r.userId === "b")?.tied).toBe(true);
    // competition ranking: next rank skips to 3
    expect(ranked.find((r) => r.userId === "c")?.rank).toBe(3);
    expect(ranked.find((r) => r.userId === "c")?.tied).toBe(false);
  });
});
