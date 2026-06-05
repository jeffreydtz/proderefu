import Link from "next/link";
import { EditorialCard } from "@/components/retro/editorial-card";
import { SectionHeader } from "@/components/retro/section-header";
import {
  getMatchesByDay,
  getPhaseState,
  type MatchDay,
  type MatchWithTeams,
} from "@/lib/queries/matches";
import { getUserPredictionsMap } from "@/lib/queries/predictions";
import { type Phase, PHASE_SHORT, phaseOfStage } from "@/lib/phase";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { PronosticosDayForm } from "./pronosticos-day-form";

const PHASES: Phase[] = ["group", "knockout"];

function defaultDayKey(days: MatchDay[]): string | null {
  const now = Date.now();
  const open = days.find((d) =>
    d.matches.some((m) => m.status === "scheduled" && m.kickoff.getTime() > now),
  );
  return (open ?? days[0])?.dayKey ?? null;
}

export default async function PronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; fase?: string }>;
}) {
  const user = await requireUser();
  const { day, fase } = await searchParams;
  const [allDays, phase] = await Promise.all([
    getMatchesByDay(),
    getPhaseState(),
  ]);

  const activePhase: Phase =
    fase === "group" || fase === "knockout" ? fase : phase.active;

  // Days that contain matches of the selected phase, each trimmed to that phase.
  const days: MatchDay[] = allDays
    .map((d) => ({
      ...d,
      matches: d.matches.filter((m) => phaseOfStage(m.stage) === activePhase),
    }))
    .filter((d) => d.matches.length > 0);

  const activeDay =
    day && days.some((d) => d.dayKey === day) ? day : defaultDayKey(days);

  const dayMatches: MatchWithTeams[] =
    days.find((d) => d.dayKey === activeDay)?.matches ?? [];

  const predMap = await getUserPredictionsMap(user.id);
  const predictions: Record<
    number,
    {
      homeScore: number;
      awayScore: number;
      editRequestedAt: Date | null;
      editApprovedAt: Date | null;
    }
  > = {};
  for (const m of dayMatches) {
    const p = predMap.get(m.id);
    if (p)
      predictions[m.id] = {
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        editRequestedAt: p.editRequestedAt,
        editApprovedAt: p.editApprovedAt,
      };
  }

  const heading = days.find((d) => d.dayKey === activeDay)?.heading ?? "";
  const knockoutLocked = activePhase === "knockout" && !phase.groupStageComplete;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Cargá tus marcadores" title="Pronósticos" />

      <PhaseTabs active={activePhase} />

      {days.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {knockoutLocked ? (
            <EditorialCard className="p-4 text-sm text-muted-foreground">
              Los pronósticos de eliminatorias se habilitan cuando termine la
              fase de grupos (ahí se definen los cruces).
            </EditorialCard>
          ) : null}
          <DaySelector days={days} active={activeDay ?? ""} fase={activePhase} />
          {heading ? (
            <h3 className="font-display text-lg font-semibold capitalize">
              {heading}
            </h3>
          ) : null}
          {dayMatches.length ? (
            <PronosticosDayForm
              matches={dayMatches}
              predictions={predictions}
              groupStageComplete={phase.groupStageComplete}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay partidos este día.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function PhaseTabs({ active }: { active: Phase }) {
  return (
    <div className="flex gap-2">
      {PHASES.map((p) => {
        const isActive = p === active;
        return (
          <Link
            key={p}
            href={`/pronosticos?fase=${p}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-95 active:bg-accent sm:flex-none",
              isActive
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border hover:bg-accent",
            )}
          >
            {PHASE_SHORT[p]}
          </Link>
        );
      })}
    </div>
  );
}

function DaySelector({
  days,
  active,
  fase,
}: {
  days: MatchDay[];
  active: string;
  fase: Phase;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {days.map((d) => {
        const [, mo, da] = d.dayKey.split("-");
        const isActive = d.dayKey === active;
        return (
          <Link
            key={d.dayKey}
            href={`/pronosticos?fase=${fase}&day=${d.dayKey}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-95 active:bg-accent",
              isActive
                ? "border-foreground bg-primary text-primary-foreground"
                : "border-border hover:bg-accent",
            )}
          >
            {da}/{mo}
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <EditorialCard className="p-8 text-center">
      <p className="font-display text-lg font-semibold">Todavía no hay fixture</p>
      <p className="mt-1 text-sm text-muted-foreground">
        El organizador tiene que cargar los partidos (seed). Volvé en un rato.
      </p>
    </EditorialCard>
  );
}
