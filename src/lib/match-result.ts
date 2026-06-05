/**
 * Pure helpers for resolving a match result. Shared by the sync pipeline and
 * the admin manual-entry action so winner logic lives in one place.
 *
 * Winner is decided by the 120' (regulation + extra-time) score; only if that
 * is level do penalties decide (knockouts). Penalties never affect prediction
 * scoring — see scoring/engine.ts.
 */
export function winnerOf(
  homeId: number,
  awayId: number,
  homeScore: number,
  awayScore: number,
  homePens: number | null,
  awayPens: number | null,
): number | null {
  if (homeScore > awayScore) return homeId;
  if (awayScore > homeScore) return awayId;
  if (homePens != null && awayPens != null) {
    if (homePens > awayPens) return homeId;
    if (awayPens > homePens) return awayId;
  }
  return null;
}
