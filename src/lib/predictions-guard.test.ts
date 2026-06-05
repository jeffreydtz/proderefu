import { describe, expect, it } from "vitest";
import {
  assertEditable,
  isEditable,
  predictionEditable,
} from "./predictions-guard";

const now = new Date("2026-06-15T12:00:00Z");
const future = new Date("2026-06-15T15:00:00Z");
const past = new Date("2026-06-15T09:00:00Z");

describe("isEditable", () => {
  it("is editable only while scheduled and before kickoff", () => {
    expect(isEditable({ status: "scheduled", kickoff: future }, now)).toBe(true);
    expect(isEditable({ status: "scheduled", kickoff: past }, now)).toBe(false);
    expect(isEditable({ status: "live", kickoff: future }, now)).toBe(false);
    expect(isEditable({ status: "finished", kickoff: future }, now)).toBe(false);
  });

  it("gates knockout matches until the group stage is complete", () => {
    const ko = { status: "scheduled" as const, kickoff: future, stage: "quarter" as const };
    const grp = { status: "scheduled" as const, kickoff: future, stage: "group" as const };
    // group stage NOT complete
    expect(isEditable(ko, now, false)).toBe(false);
    expect(isEditable(grp, now, false)).toBe(true);
    // group stage complete
    expect(isEditable(ko, now, true)).toBe(true);
    // a started knockout match is still locked even once groups are done
    expect(isEditable({ ...ko, kickoff: past }, now, true)).toBe(false);
  });
});

describe("predictionEditable", () => {
  const D = new Date("2026-06-15T10:00:00Z");
  it("blocks everything when the match gate is closed", () => {
    expect(
      predictionEditable({ matchEditable: false, hasRow: false, editApprovedAt: null }),
    ).toBe(false);
    expect(
      predictionEditable({ matchEditable: false, hasRow: true, editApprovedAt: D }),
    ).toBe(false);
  });
  it("allows the first save (no existing row)", () => {
    expect(
      predictionEditable({ matchEditable: true, hasRow: false, editApprovedAt: null }),
    ).toBe(true);
  });
  it("locks an existing prediction unless an edit was approved", () => {
    expect(
      predictionEditable({ matchEditable: true, hasRow: true, editApprovedAt: null }),
    ).toBe(false);
    expect(
      predictionEditable({ matchEditable: true, hasRow: true, editApprovedAt: D }),
    ).toBe(true);
  });
});

describe("assertEditable", () => {
  it("throws when locked", () => {
    expect(() =>
      assertEditable({ status: "scheduled", kickoff: past }, now),
    ).toThrow();
    expect(() =>
      assertEditable({ status: "scheduled", kickoff: future }, now),
    ).not.toThrow();
  });
});
