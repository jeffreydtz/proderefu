import { EditorialCard } from "@/components/retro/editorial-card";
import { FlagName } from "@/components/retro/flag-name";
import { SectionHeader } from "@/components/retro/section-header";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { buildBracket } from "@/lib/bracket-service";
import type { BracketSlot, ResolvedSide } from "@/lib/bracket";
import { formatKickoff, stageLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function LlavePage() {
  const rounds = await buildBracket();

  if (!rounds.length) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Eliminatorias" title="Llave" />
        <EditorialCard className="p-8 text-center text-sm text-muted-foreground">
          La llave aparece cuando se cargan los partidos de eliminación.
        </EditorialCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Eliminatorias" title="Llave" />
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {rounds.map((r) => (
            <div key={r.stage} className="flex w-60 shrink-0 flex-col gap-3">
              <h3 className="eyebrow text-center">{stageLabel(r.stage)}</h3>
              {r.slots.map((s) => (
                <BracketCard key={s.matchId} slot={s} />
              ))}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

function BracketCard({ slot }: { slot: BracketSlot }) {
  const finished = slot.status === "finished";
  const hasPens = slot.homePens != null && slot.awayPens != null;
  return (
    <EditorialCard pop={false} className="p-2.5">
      <SideRow
        side={slot.home}
        score={slot.homeScore}
        winner={
          slot.winnerTeamId != null && slot.home.team?.id === slot.winnerTeamId
        }
      />
      <div className="my-1 h-px bg-border" />
      <SideRow
        side={slot.away}
        score={slot.awayScore}
        winner={
          slot.winnerTeamId != null && slot.away.team?.id === slot.winnerTeamId
        }
      />
      <div className="mt-1.5 text-center text-[0.6rem] text-muted-foreground">
        {finished
          ? hasPens
            ? `Penales ${slot.homePens}-${slot.awayPens}`
            : "Finalizado"
          : formatKickoff(slot.kickoff)}
      </div>
    </EditorialCard>
  );
}

function SideRow({
  side,
  score,
  winner,
}: {
  side: ResolvedSide;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2",
        winner && "font-bold",
      )}
    >
      <FlagName
        team={side.team}
        placeholder={side.team ? undefined : side.label}
        size="sm"
      />
      <span className="stat-num tabular-nums text-lg">
        {score ?? "–"}
      </span>
    </div>
  );
}
