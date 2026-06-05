import { cn } from "@/lib/utils";
import { ordinalRank } from "@/lib/format";
import { StatNumber } from "./stat-number";

/**
 * Leaderboard / player-list row: rank chip + name + meta, with a big number on
 * the right. Active rows get the brick-red left stripe.
 */
export function RankRow({
  rank,
  tied = false,
  name,
  meta,
  points,
  active = false,
  highlight = false,
  className,
}: {
  rank: number;
  tied?: boolean;
  name: React.ReactNode;
  meta?: React.ReactNode;
  points: number;
  active?: boolean;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0",
        active && "rank-stripe bg-primary/5",
        highlight && !active && "bg-gold/10",
        className,
      )}
    >
      <span
        className={cn(
          "stat-num w-9 shrink-0 text-center text-2xl",
          rank === 1 && "text-primary",
        )}
      >
        {ordinalRank(rank, tied)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-base font-semibold leading-tight">
          {name}
        </div>
        {meta ? (
          <div className="truncate text-xs text-muted-foreground">{meta}</div>
        ) : null}
      </div>
      <StatNumber value={points} size="sm" className="shrink-0" />
    </div>
  );
}
