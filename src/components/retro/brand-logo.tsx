import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

/** The geometric "P" mark (brick-red tile + cream P + gold underline). */
function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Prode Mundial 2026"
      className="shrink-0"
    >
      <rect width="64" height="64" rx="14" fill={BRAND.red} />
      <rect x="19" y="12" width="10" height="38" rx="2" fill={BRAND.cream} />
      <circle cx="34" cy="24" r="15" fill={BRAND.cream} />
      <circle cx="37" cy="24" r="6" fill={BRAND.red} />
      <rect x="16" y="49" width="32" height="5" rx="2.5" fill={BRAND.gold} />
    </svg>
  );
}

/**
 * App logo lockup: the mark + "PRODE '26" wordmark. Set `showWordmark={false}`
 * for the mark alone. The wordmark inherits the current text colour (themed).
 */
export function BrandLogo({
  className,
  size = 28,
  showWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Mark size={size} />
      {showWordmark && (
        <span className={cn("flex items-baseline gap-1.5", wordmarkClassName)}>
          <span className="font-display text-xl font-black leading-none tracking-tight">
            PRODE
          </span>
          <span className="rounded bg-gold px-1.5 font-stat text-lg leading-none text-gold-foreground">
            &apos;26
          </span>
        </span>
      )}
    </span>
  );
}
