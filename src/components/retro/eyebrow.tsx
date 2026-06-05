import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("eyebrow", className)} {...props} />;
}
