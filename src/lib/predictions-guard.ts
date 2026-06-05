import type { MatchStatus, Stage } from "@/db/schema";

export interface EditableMatch {
  kickoff: Date;
  status: MatchStatus;
  /** Optional — when set, knockout matches gate on `groupStageComplete`. */
  stage?: Stage;
}

/**
 * A prediction is editable only while the match is still "scheduled" AND the
 * kickoff is in the future. Knockout matches are additionally gated: they can't
 * be predicted until the group stage finishes (`groupStageComplete`) — that's
 * when their teams resolve. Mirror of isLocked()/lock UI, but pure and
 * injectable (`now`, `groupStageComplete`) so it's unit-testable and safe to
 * enforce server-side.
 */
export function isEditable(
  match: EditableMatch,
  now: Date = new Date(),
  groupStageComplete = true,
): boolean {
  if (match.status !== "scheduled" || match.kickoff.getTime() <= now.getTime()) {
    return false;
  }
  if (match.stage && match.stage !== "group" && !groupStageComplete) {
    return false;
  }
  return true;
}

export function assertEditable(
  match: EditableMatch,
  now: Date = new Date(),
  groupStageComplete = true,
): void {
  if (!isEditable(match, now, groupStageComplete)) {
    throw new Error(
      "Pronóstico cerrado: el partido ya empezó o aún no está disponible.",
    );
  }
}
