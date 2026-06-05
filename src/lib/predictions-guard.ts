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

/**
 * Whether a player may save a prediction right now. A saved prediction is fixed:
 * the first save (no existing row) is allowed; an existing row is locked unless
 * an admin approved an edit (`editApprovedAt` set — that approval is consumed on
 * the next save, re-locking it). `matchEditable` is the match-level gate
 * (`isEditable`).
 */
export function predictionEditable(opts: {
  matchEditable: boolean;
  hasRow: boolean;
  editApprovedAt: Date | null;
}): boolean {
  if (!opts.matchEditable) return false;
  if (!opts.hasRow) return true; // first save
  return opts.editApprovedAt != null; // locked unless an approved edit is pending
}
