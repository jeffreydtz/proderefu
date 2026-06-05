import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

/** Outlined (or solid) pill button matching the retro editorial chrome. */
export function PillButton({ className, variant = "outline", ...props }: ButtonProps) {
  return (
    <Button
      variant={variant}
      className={cn("rounded-full border-foreground font-medium", className)}
      {...props}
    />
  );
}
