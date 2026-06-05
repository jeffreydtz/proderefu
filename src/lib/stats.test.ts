import { describe, expect, it } from "vitest";
import { computeAccuracy, computeBestMatchday, computeStreak } from "./stats";

const d = (n: number) => new Date(2026, 5, n);

describe("computeAccuracy", () => {
  it("is the % of scored predictions with any points", () => {
    expect(computeAccuracy(3, 10)).toBe(30);
    expect(computeAccuracy(0, 0)).toBe(0);
    expect(computeAccuracy(1, 3)).toBe(33);
  });
});

describe("computeStreak", () => {
  it("counts the trailing run of scored matches with points > 0", () => {
    const preds = [
      { pointsAwarded: 3, kickoff: d(1) },
      { pointsAwarded: 0, kickoff: d(2) },
      { pointsAwarded: 1, kickoff: d(3) },
      { pointsAwarded: 3, kickoff: d(4) },
    ];
    expect(computeStreak(preds)).toBe(2);
  });

  it("ignores unscored predictions and breaks on a zero", () => {
    const preds = [
      { pointsAwarded: 3, kickoff: d(1) },
      { pointsAwarded: null, kickoff: d(5) },
      { pointsAwarded: 0, kickoff: d(2) },
    ];
    expect(computeStreak(preds)).toBe(0);
  });
});

describe("computeBestMatchday", () => {
  it("sums points per group matchday and picks the best", () => {
    const best = computeBestMatchday([
      { matchday: 1, pointsAwarded: 3 },
      { matchday: 1, pointsAwarded: 1 },
      { matchday: 2, pointsAwarded: 3 },
      { matchday: null, pointsAwarded: 9 }, // knockout — ignored
    ]);
    expect(best).toEqual({ matchday: 1, points: 4 });
  });

  it("returns null with no scored group matches", () => {
    expect(computeBestMatchday([{ matchday: null, pointsAwarded: 3 }])).toBeNull();
  });
});
