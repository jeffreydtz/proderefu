import { EditorialCard } from "@/components/retro/editorial-card";
import { Eyebrow } from "@/components/retro/eyebrow";
import { SectionHeader } from "@/components/retro/section-header";
import { StatNumber } from "@/components/retro/stat-number";
import { Progress } from "@/components/ui/progress";
import { ordinalRank } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { getUserStats } from "@/lib/stats-service";
import { cn } from "@/lib/utils";

export default async function PerfilPage() {
  const user = await requireUser();
  const s = await getUserStats(user.id);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Tu rendimiento" title={s.displayName} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Puntos" value={s.totalPoints} accent />
        <StatTile label="Posición" value={ordinalRank(s.rank, s.tied)} />
        <StatTile label="Racha" value={s.currentStreak} />
        <StatTile label="Exactos" value={s.exactHits} />
        <StatTile label="Resultados" value={s.outcomeHits} />
        <StatTile label="Pronosticados" value={s.predictedCount} />
      </div>

      <EditorialCard className="space-y-2 p-4">
        <Eyebrow>Precisión · {s.scoredCount} partidos jugados</Eyebrow>
        <Progress value={s.accuracyPct} />
        <p className="text-sm text-muted-foreground">
          {s.accuracyPct}% de aciertos · Promedio del pozo {s.poolAvgPoints} pts ·
          estás{" "}
          <span
            className={cn(
              "font-semibold",
              s.vsAvg >= 0 ? "text-grass" : "text-destructive",
            )}
          >
            {s.vsAvg >= 0 ? `+${s.vsAvg}` : s.vsAvg}
          </span>{" "}
          vs el promedio
        </p>
      </EditorialCard>

      {s.bestMatchday ? (
        <EditorialCard className="p-4">
          <Eyebrow>Mejor jornada</Eyebrow>
          <p className="mt-1 font-display text-lg font-semibold">
            Fecha {s.bestMatchday.matchday} — {s.bestMatchday.points} pts
          </p>
        </EditorialCard>
      ) : null}
    </div>
  );
}

function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <EditorialCard
      className={cn(
        "flex flex-col items-center gap-1 p-4 text-center",
        accent && "bg-primary text-primary-foreground",
      )}
    >
      <StatNumber value={value} size="lg" />
      <Eyebrow className={accent ? "text-primary-foreground/80" : undefined}>
        {label}
      </Eyebrow>
    </EditorialCard>
  );
}
