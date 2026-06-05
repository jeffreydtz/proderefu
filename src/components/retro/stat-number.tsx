import { cn } from "@/lib/utils";

const SIZES = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
  xl: "text-7xl sm:text-8xl",
} as const;

export function StatNumber({
  value,
  size = "md",
  className,
}: {
  value: React.ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span className={cn("stat-num inline-block", SIZES[size], className)}>
      {value}
    </span>
  );
}
