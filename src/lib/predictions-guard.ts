import type { MatchStatus } from "@/db/schema";

export interface EditableMatch {
  kickoff: Date;
  status: MatchStatus;
}

/**
 * A prediction is editable only while the match is still "scheduled" AND the
 * kickoff is in the future. Mirror of isLocked() in format.ts, but pure and
 * injectable (`now`) so it's unit-testable and safe to enforce server-side.
 */
export function isEditable(
  match: EditableMatch,
  now: Date = new Date(),
): boolean {
  return match.status === "scheduled" && match.kickoff.getTime() > now.getTime();
}

export function assertEditable(
  match: EditableMatch,
  now: Date = new Date(),
): void {
  if (!isEditable(match, now)) {
    throw new Error(
      "Pronóstico cerrado: el partido ya empezó o no está disponible.",
    );
  }
}
