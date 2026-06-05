import Link from "next/link";
import { EditorialCard } from "@/components/retro/editorial-card";
import { FlagName } from "@/components/retro/flag-name";
import { ScoreBox } from "@/components/retro/score-box";
import { SectionHeader } from "@/components/retro/section-header";
import { Badge } from "@/components/ui/badge";
import { STAGE_ORDER, formatTime, stageLabel } from "@/lib/format";
import { getMatchesByDay, type MatchWithTeams } from "@/lib/queries/matches";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function PartidosPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>;
}) {
  await requireUser();
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
      <SectionHeader eyebrow="Resultados y fixture" title="Partidos" />
      <StageFilter active={stage ?? "all"} />

      {filtered.length === 0 ? (
        <EditorialCard className="p-8 text-center text-sm text-muted-foreground">
          No hay partidos para mostrar.
        </EditorialCard>
      ) : (
        filtered.map((day) => (
          <section key={day.dayKey} className="space-y-2">
            <h3 className="font-display text-base font-semibold capitalize">
              {day.heading}
            </h3>
            <EditorialCard className="divide-y divide-border p-0">
              {day.matches.map((m) => (
                <MatchRow key={m.id} m={m} />
              ))}
            </EditorialCard>
          </section>
        ))
      )}
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
          href={o.key === "all" ? "/partidos" : `/partidos?stage=${o.key}`}
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

function MatchRow({ m }: { m: MatchWithTeams }) {
  const showScore = m.status === "finished" || m.status === "live";
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3 sm:gap-4">
      <div className="flex min-w-0 justify-end text-right">
        <FlagName team={m.homeTeam} placeholder={m.homePlaceholder} />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        {showScore ? (
          <ScoreBox
            home={m.homeScore}
            away={m.awayScore}
            homePens={m.homePens}
            awayPens={m.awayPens}
            size="sm"
          />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {formatTime(m.kickoff)}
          </span>
        )}
        {m.status === "live" ? (
          <Badge variant="destructive" className="h-4 px-1.5 text-[0.6rem]">
            EN VIVO
          </Badge>
        ) : (
          <span className="eyebrow text-[0.6rem]">
            {m.groupLetter ? `Grupo ${m.groupLetter}` : stageLabel(m.stage)}
          </span>
        )}
      </div>
      <div className="flex min-w-0 justify-start">
        <FlagName team={m.awayTeam} placeholder={m.awayPlaceholder} />
      </div>
    </div>
  );
}
