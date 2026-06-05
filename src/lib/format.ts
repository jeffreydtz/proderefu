import type { Stage } from "@/db/schema";

const TZ = process.env.NEXT_PUBLIC_TZ ?? "America/Argentina/Buenos_Aires";
const LOCALE = "es-AR";

export const STAGE_LABELS: Record<Stage, string> = {
  group: "Fase de grupos",
  round_of_32: "Dieciseisavos",
  round_of_16: "Octavos",
  quarter: "Cuartos",
  semi: "Semifinal",
  third_place: "Tercer puesto",
  final: "Final",
};

export const STAGE_ORDER: Stage[] = [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
];

export function stageLabel(stage: Stage): string {
  return STAGE_LABELS[stage] ?? stage;
}

export function formatKickoff(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** A stable day key (yyyy-mm-dd in the configured tz) for grouping matches. */
export function dayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function formatDayHeading(d: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

/** Has the match kicked off (predictions locked) ? */
export function isLocked(kickoff: Date, status: string): boolean {
  return status !== "scheduled" || kickoff.getTime() <= Date.now();
}

export function ordinalRank(rank: number, tied: boolean): string {
  return tied ? `=${rank}` : `${rank}`;
}

/** Whether an (optional) expiry timestamp is in the past. */
export function isExpired(expiresAt: Date | null | undefined): boolean {
  return expiresAt != null && expiresAt.getTime() < Date.now();
}
