import { cn } from "@/lib/utils";

/**
 * Bordered "print" card — crisp ink outline + hard offset pop shadow, the
 * signature of the retro editorial look.
 */
export function EditorialCard({
  className,
  pop = true,
  ...props
}: React.ComponentProps<"div"> & { pop?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-foreground bg-card text-card-foreground",
        pop && "pop-shadow",
        className,
      )}
      {...props}
    />
  );
}
