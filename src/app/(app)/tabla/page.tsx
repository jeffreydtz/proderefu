import { EditorialCard } from "@/components/retro/editorial-card";
import { RankRow } from "@/components/retro/rank-row";
import { SectionHeader } from "@/components/retro/section-header";
import { db } from "@/db";
import { getLeaderboard } from "@/lib/scoring/service";
import { requireUser } from "@/lib/session";

export default async function TablaPage() {
  const user = await requireUser();
  const [board, settings] = await Promise.all([
    getLeaderboard(),
    db.query.settings.findFirst(),
  ]);

  if (!board.length) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Posiciones" title="Tabla" />
        <EditorialCard className="p-8 text-center text-sm text-muted-foreground">
          Todavía no hay jugadores. Invitá a tus amigos desde el panel de admin.
        </EditorialCard>
      </div>
    );
  }

  const exact = settings?.pointsExact ?? 3;
  const outcome = settings?.pointsOutcome ?? 1;

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Posiciones" title="Tabla" />
      <EditorialCard className="overflow-hidden p-0">
        {board.map((r) => (
          <RankRow
            key={r.userId}
            rank={r.rank}
            tied={r.tied}
            name={r.displayName}
            meta={`${r.exactHits} exactos · ${r.outcomeHits} resultados · ${r.scoredCount} jugados`}
            points={r.points}
            active={r.userId === user.id}
            highlight={r.rank === 1}
          />
        ))}
      </EditorialCard>
      <p className="eyebrow">
        Exacto = {exact} pts · Resultado = {outcome} pt
        {outcome === 1 ? "" : "s"} · Penales no cuentan
      </p>
    </div>
  );
}
