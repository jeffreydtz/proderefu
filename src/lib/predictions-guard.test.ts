import { describe, expect, it } from "vitest";
import { assertEditable, isEditable } from "./predictions-guard";

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
