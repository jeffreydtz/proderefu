import Link from "next/link";
import { EditorialCard } from "@/components/retro/editorial-card";
import { SectionHeader } from "@/components/retro/section-header";
import { STAGE_ORDER, formatTime, stageLabel } from "@/lib/format";
import { getMatchesByDay, type MatchWithTeams } from "@/lib/queries/matches";
import { cn } from "@/lib/utils";
import { ManualResultForm } from "./manual-result-form";

export default async function ResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  const { stage } = await searchParams;
  const days = await getMatchesByDay();
  const filtered =
    stage && stage !== "all"
      ? days
          .map((d) => ({
            ...d,
            matches: d.matches.filter((m) => m.stage === stage),
          }))
          .filter((d) => d.matches.length)
      : days;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Carga manual · pisa la sync"
        title="Resultados"
      />
      <StageFilter active={stage ?? "all"} />

      {filtered.length === 0 ? (
        <EditorialCard className="p-8 text-center text-sm text-muted-foreground">
          No hay partidos.
        </EditorialCard>
      ) : (
        filtered.map((day) => (
          <section key={day.dayKey} className="space-y-2">
            <h3 className="font-display text-base font-semibold capitalize">
              {day.heading}
            </h3>
            <EditorialCard className="divide-y divide-border p-2">
              {day.matches.map((m) => (
                <MatchEditor key={m.id} m={m} />
              ))}
            </EditorialCard>
          </section>
        ))
      )}
    </div>
  );
}

function MatchEditor({ m }: { m: MatchWithTeams }) {
  if (!m.homeTeam || !m.awayTeam) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <span className="w-14 text-xs">{formatTime(m.kickoff)}</span>
        <span className="italic">
          {m.homePlaceholder ?? "?"} vs {m.awayPlaceholder ?? "?"} — equipos por
          definir
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-muted-foreground">
        {formatTime(m.kickoff)}
      </span>
      <ManualResultForm
        matchId={m.id}
        home={m.homeTeam.name}
        away={m.awayTeam.name}
        homeScore={m.homeScore}
        awayScore={m.awayScore}
        homePens={m.homePens}
        awayPens={m.awayPens}
        knockout={m.stage !== "group"}
        locked={m.manualLocked}
      />
    </div>
  );
}

function StageFilter({ active }: { active: string }) {
  const options = [{ key: "all", label: "Todos" }].concat(
    STAGE_ORDER.map((s) => ({ key: s, label: stageLabel(s) })),
  );
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.key === "all" ? "/admin/resultados" : `/admin/resultados?stage=${o.key}`}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
            active === o.key
              ? "border-foreground bg-primary text-primary-foreground"
              : "border-border hover:bg-accent",
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
