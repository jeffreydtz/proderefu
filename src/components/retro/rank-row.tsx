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
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0",
        active && "rank-stripe bg-primary/5",
        highlight && !active && "bg-gold/10",
        className,
      )}
    >
      <span
        className={cn(
          "stat-num min-w-[2.5rem] shrink-0 px-0.5 text-right text-2xl tabular-nums",
          rank === 1 && "text-primary",
        )}
      >
        {ordinalRank(rank, tied)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-display text-base font-semibold leading-tight">
            {name}
          </span>
          {active ? (
            <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Vos
            </span>
          ) : null}
        </div>
        {meta ? (
          <div className="text-[0.8125rem] leading-snug text-muted-foreground">
            {meta}
          </div>
        ) : null}
      </div>
      <StatNumber value={points} size="sm" className="shrink-0" />
    </div>
  );
}
