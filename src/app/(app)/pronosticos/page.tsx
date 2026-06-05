import Link from "next/link";
import { EditorialCard } from "@/components/retro/editorial-card";
import { SectionHeader } from "@/components/retro/section-header";
import {
  getMatchesByDay,
  getMatchesForDay,
  getUpcomingDayKey,
  type MatchDay,
} from "@/lib/queries/matches";
import { getUserPredictionsMap } from "@/lib/queries/predictions";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { PronosticosDayForm } from "./pronosticos-day-form";

export default async function PronosticosPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const user = await requireUser();
  const { day } = await searchParams;
  const days = await getMatchesByDay();
  const activeDay = day ?? (await getUpcomingDayKey());

  if (!activeDay || days.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Cargá tus marcadores" title="Pronósticos" />
        <EmptyState />
      </div>
    );
  }

  const dayMatches = await getMatchesForDay(activeDay);
  const predMap = await getUserPredictionsMap(user.id);
  const predictions: Record<number, { homeScore: number; awayScore: number }> =
    {};
  for (const m of dayMatches) {
    const p = predMap.get(m.id);
    if (p) predictions[m.id] = { homeScore: p.homeScore, awayScore: p.awayScore };
  }

  const heading = days.find((d) => d.dayKey === activeDay)?.heading ?? "";

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Cargá tus marcadores" title="Pronósticos" />
      <DaySelector days={days} active={activeDay} />
      {heading ? (
        <h3 className="font-display text-lg font-semibold capitalize">
          {heading}
        </h3>
      ) : null}
      {dayMatches.length ? (
        <PronosticosDayForm matches={dayMatches} predictions={predictions} />
      ) : (
        <p className="text-sm text-muted-foreground">No hay partidos este día.</p>
      )}
    </div>
  );
}

function DaySelector({ days, active }: { days: MatchDay[]; active: string }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {days.map((d) => {
        const [, mo, da] = d.dayKey.split("-");
        const isActive = d.dayKey === active;
        return (
          <Link
            key={d.dayKey}
            href={`/pronosticos?day=${d.dayKey}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
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
