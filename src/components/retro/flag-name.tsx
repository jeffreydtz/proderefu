import { cn } from "@/lib/utils";
import { teamCode, teamFlag } from "@/lib/flags";

type TeamLike = {
  name: string;
  shortName?: string | null;
  code?: string | null;
} | null;

const CREST = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
} as const;

const NAME = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
} as const;

/**
 * Team crest (flag emoji) + name. When the slot is an unresolved knockout
 * placeholder ("1A", "Ganador 73") it renders a dashed, muted chip instead.
 */
export function FlagName({
  team,
  placeholder,
  size = "md",
  showCode = false,
  className,
}: {
  team?: TeamLike;
  placeholder?: string | null;
  size?: keyof typeof CREST;
  showCode?: boolean;
  className?: string;
}) {
  if (!team) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-2 text-muted-foreground",
          className,
        )}
      >
        <span className="grid size-7 place-items-center rounded border border-dashed border-muted-foreground/60 text-[0.6rem] font-semibold">
          ?
        </span>
        <span className={cn("font-medium italic", NAME[size])}>
          {placeholder ?? "Por definir"}
        </span>
      </span>
    );
  }

  const { emoji } = teamFlag(team.name);
  const label = team.shortName || team.name;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("leading-none", CREST[size])} aria-hidden>
        {emoji}
      </span>
      <span className={cn("font-display font-semibold", NAME[size])}>
        {label}
      </span>
      {showCode ? (
        <span className="text-xs font-medium text-muted-foreground">
          {teamCode(team.name, team.code)}
        </span>
      ) : null}
    </span>
  );
}
