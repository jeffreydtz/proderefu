import { cn } from "@/lib/utils";

function cell(n: number | null | undefined): string {
  return n === null || n === undefined ? "–" : String(n);
}

/**
 * Scoreboard-style box: `2 – 1`, with optional small penalty shootout note.
 * Pass regulation/ET score in home/away; pens are display-only.
 */
export function ScoreBox({
  home,
  away,
  homePens,
  awayPens,
  size = "md",
  className,
}: {
  home: number | null | undefined;
  away: number | null | undefined;
  homePens?: number | null;
  awayPens?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasPens = homePens != null && awayPens != null;
  const sizeCls =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-2xl";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-foreground bg-background px-2 py-0.5",
        className,
      )}
    >
      <span className={cn("stat-num tabular-nums", sizeCls)}>{cell(home)}</span>
      <span className="text-muted-foreground">–</span>
      <span className={cn("stat-num tabular-nums", sizeCls)}>{cell(away)}</span>
      {hasPens ? (
        <span className="ml-1 text-xs font-medium text-muted-foreground">
          ({homePens}-{awayPens} pen)
        </span>
      ) : null}
    </span>
  );
}
