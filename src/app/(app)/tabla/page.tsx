import Link from "next/link";
import { EditorialCard } from "@/components/retro/editorial-card";
import { RankRow } from "@/components/retro/rank-row";
import { SectionHeader } from "@/components/retro/section-header";
import { db } from "@/db";
import { getLeaderboard, type LeaderboardScope } from "@/lib/scoring/service";
import { getPhaseState } from "@/lib/queries/matches";
import { PHASE_LABELS } from "@/lib/phase";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const TABS: { scope: LeaderboardScope; label: string }[] = [
  { scope: "all", label: "General" },
  { scope: "group", label: "Grupos" },
  { scope: "knockout", label: "Eliminatorias" },
];

export default async function TablaPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string }>;
}) {
  const user = await requireUser();
  const { fase } = await searchParams;
  const scope: LeaderboardScope =
    fase === "group" || fase === "knockout" ? fase : "all";

  const [board, settings, phase] = await Promise.all([
    getLeaderboard(scope),
    db.query.settings.findFirst(),
    getPhaseState(),
  ]);

  const exact = settings?.pointsExact ?? 3;
  const outcome = settings?.pointsOutcome ?? 1;

  return (
    <div className="space-y-4">
      <SectionHeader
        eyebrow={`En juego · ${PHASE_LABELS[phase.active]}`}
        title="Tabla"
      />

      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((t) => {
          const isActive = t.scope === scope;
          return (
            <Link
              key={t.scope}
              href={t.scope === "all" ? "/tabla" : `/tabla?fase=${t.scope}`}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors active:scale-95 active:bg-accent",
                isActive
                  ? "border-foreground bg-primary text-primary-foreground"
                  : "border-border hover:bg-accent",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {board.length ? (
        <EditorialCard className="overflow-hidden p-0">
          {board.map((r) => (
            <RankRow
              key={r.userId}
              rank={r.rank}
              tied={r.tied}
              name={r.displayName}
              meta={`${r.exactHits} exa · ${r.outcomeHits} res · ${r.scoredCount} jug`}
              points={r.points}
              active={r.userId === user.id}
              highlight={r.rank === 1}
            />
          ))}
        </EditorialCard>
      ) : (
        <EditorialCard className="p-8 text-center text-sm text-muted-foreground">
          Todavía no hay jugadores. Invitá a tus amigos desde el panel de admin.
        </EditorialCard>
      )}

      <p className="text-sm text-muted-foreground">
        {scope === "all"
          ? "Puntos de todo el torneo. "
          : scope === "group"
            ? "Solo puntos de la fase de grupos. "
            : "Solo puntos de eliminatorias. "}
        Exacto = {exact} pts · Resultado = {outcome} pt
        {outcome === 1 ? "" : "s"}
        {scope === "group" ? "" : " · Penales no cuentan"}
      </p>
    </div>
  );
}
