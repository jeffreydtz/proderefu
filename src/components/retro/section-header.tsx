import { cn } from "@/lib/utils";
import { Eyebrow } from "./eyebrow";

export function SectionHeader({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-bold leading-none tracking-tight sm:text-3xl">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="rule" />
    </div>
  );
}
