import { eq } from "drizzle-orm";
import { EditorialCard } from "@/components/retro/editorial-card";
import { Eyebrow } from "@/components/retro/eyebrow";
import { SectionHeader } from "@/components/retro/section-header";
import { StatNumber } from "@/components/retro/stat-number";
import { Progress } from "@/components/ui/progress";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ordinalRank } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { getUserStats } from "@/lib/stats-service";
import { cn } from "@/lib/utils";
import { EditNameForm } from "./edit-name-form";

export default async function PerfilPage() {
  const user = await requireUser();
  const [s, me] = await Promise.all([
    getUserStats(user.id),
    db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { displayName: true, name: true },
    }),
  ]);
  const currentName = me?.displayName || me?.name || s.displayName || "";

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Tu rendimiento" title={s.displayName} />

      <EditorialCard className="space-y-2 p-4">
        <Eyebrow>Tu nombre</Eyebrow>
        <EditNameForm current={currentName} />
        <p className="text-xs text-muted-foreground">
          Así aparecés en la tabla y en los pronósticos.
        </p>
      </EditorialCard>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Puntos" value={s.totalPoints} accent />
        <StatTile label="Pts grupos" value={s.groupPoints} />
        <StatTile label="Pts elim." value={s.knockoutPoints} />
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
        "flex min-w-0 flex-col items-center gap-1 p-3 text-center sm:p-4",
        accent && "bg-primary text-primary-foreground",
      )}
    >
      <StatNumber
        value={value}
        size="lg"
        className="max-w-full break-words text-4xl leading-none tabular-nums sm:text-6xl"
      />
      <Eyebrow className={accent ? "text-primary-foreground/80" : undefined}>
        {label}
      </Eyebrow>
    </EditorialCard>
  );
}
