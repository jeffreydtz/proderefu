import Link from "next/link";
import { EditorialCard } from "@/components/retro/editorial-card";
import { SectionHeader } from "@/components/retro/section-header";
import { STAGE_ORDER, stageLabel } from "@/lib/format";
import { type Phase, PHASE_SHORT } from "@/lib/phase";
import {
  getAllMatches,
  getPhaseState,
  type MatchWithTeams,
} from "@/lib/queries/matches";
import { getUserPredictionsMap } from "@/lib/queries/predictions";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { type MatchGroup, PronosticosDayForm } from "./pronosticos-day-form";

const PHASES: Phase[] = ["group", "knockout"];

/** Group matches by matchday ("Fecha 1/2/3") for groups, by stage for knockout.
 *  Source is already chronological, so each bucket stays sorted by kickoff. */
function groupByRound(all: MatchWithTeams[], phase: Phase): MatchGroup[] {
  if (phase === "group") {
    const byMd = new Map<number, MatchWithTeams[]>();
    for (const m of all) {
      if (m.stage !== "group" || m.matchday == null) continue;
      const a = byMd.get(m.matchday);
      if (a) a.push(m);
      else byMd.set(m.matchday, [m]);
    }
    return [...byMd.keys()]
      .sort((x, y) => x - y)
      .map((md) => ({
        key: `md-${md}`,
        heading: `Fecha ${md}`,
        matches: byMd.get(md)!,
      }));
  }
  const byStage = new Map<string, MatchWithTeams[]>();
  for (const m of all) {
    if (m.stage === "group") continue;
    const a = byStage.get(m.stage);
    if (a) a.push(m);
    else byStage.set(m.stage, [m]);
  }
  return STAGE_ORDER.filter((s) => s !== "group" && byStage.has(s)).map((s) => ({
    key: s,
    heading: stageLabel(s),
    matches: byStage.get(s)!,
  }));
}

export default async function PronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string }>;
}) {
  const user = await requireUser();
  const { fase } = await searchParams;
  const [all, phase] = await Promise.all([getAllMatches(), getPhaseState()]);

  const activePhase: Phase =
    fase === "group" || fase === "knockout" ? fase : phase.active;

  const groups = groupByRound(all, activePhase);

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
  for (const g of groups)
    for (const m of g.matches) {
      const p = predMap.get(m.id);
      if (p)
        predictions[m.id] = {
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          editRequestedAt: p.editRequestedAt,
          editApprovedAt: p.editApprovedAt,
        };
    }

  const knockoutLocked = activePhase === "knockout" && !phase.groupStageComplete;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Cargá tus marcadores" title="Pronósticos" />

      <PhaseTabs active={activePhase} />

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {knockoutLocked ? (
            <EditorialCard className="p-4 text-sm text-muted-foreground">
              Los pronósticos de eliminatorias se habilitan cuando termine la
              fase de grupos (ahí se definen los cruces).
            </EditorialCard>
          ) : null}
          <PronosticosDayForm
            groups={groups}
            predictions={predictions}
            groupStageComplete={phase.groupStageComplete}
          />
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
