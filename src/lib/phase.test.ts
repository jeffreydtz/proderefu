import { describe, expect, it } from "vitest";
import { computePhaseState, phaseOfStage } from "./phase";

describe("phaseOfStage", () => {
  it("maps group to group and everything else to knockout", () => {
    expect(phaseOfStage("group")).toBe("group");
    expect(phaseOfStage("round_of_32")).toBe("knockout");
    expect(phaseOfStage("round_of_16")).toBe("knockout");
    expect(phaseOfStage("quarter")).toBe("knockout");
    expect(phaseOfStage("semi")).toBe("knockout");
    expect(phaseOfStage("third_place")).toBe("knockout");
    expect(phaseOfStage("final")).toBe("knockout");
  });
});

describe("computePhaseState", () => {
  it("stays in group phase while group matches remain", () => {
    const s = computePhaseState(72, 40);
    expect(s.active).toBe("group");
    expect(s.groupStageComplete).toBe(false);
  });

  it("flips to knockout once all group matches are finished", () => {
    const s = computePhaseState(72, 0);
    expect(s.active).toBe("knockout");
    expect(s.groupStageComplete).toBe(true);
  });

  it("stays in group phase when nothing is seeded yet (avoids false knockout)", () => {
    const s = computePhaseState(0, 0);
    expect(s.active).toBe("group");
    expect(s.groupStageComplete).toBe(false);
  });
});
