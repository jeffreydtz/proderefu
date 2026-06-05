// Pure phase helpers — no DB, unit-testable.
// The tournament has two phases: group stage and knockout ("eliminatorias").
// The active phase is automatic: it flips to knockout once every group match
// is finished.
import type { Stage } from "@/db/schema";

export type Phase = "group" | "knockout";

export const PHASE_LABELS: Record<Phase, string> = {
  group: "Fase de grupos",
  knockout: "Eliminatorias",
};

export const PHASE_SHORT: Record<Phase, string> = {
  group: "Grupos",
  knockout: "Eliminatorias",
};

/** Which phase a match stage belongs to. */
export function phaseOfStage(stage: Stage): Phase {
  return stage === "group" ? "group" : "knockout";
}

export interface PhaseState {
  /** The phase currently in play. */
  active: Phase;
  /** True once all group matches are finished (knockout predictions unlock). */
  groupStageComplete: boolean;
  groupTotal: number;
  groupRemaining: number;
}

/**
 * Derive the phase state from group-match counts. Group stage is complete only
 * when there is at least one group match and none remain unfinished — so a
 * not-yet-seeded DB stays in the group phase rather than jumping to knockout.
 */
export function computePhaseState(
  groupTotal: number,
  groupRemaining: number,
): PhaseState {
  const groupStageComplete = groupTotal > 0 && groupRemaining === 0;
  return {
    active: groupStageComplete ? "knockout" : "group",
    groupStageComplete,
    groupTotal,
    groupRemaining,
  };
}
