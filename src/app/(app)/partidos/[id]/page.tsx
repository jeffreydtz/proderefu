import Link from "next/link";
import { notFound } from "next/navigation";
import { EditorialCard } from "@/components/retro/editorial-card";
import { FlagName } from "@/components/retro/flag-name";
import { ScoreBox } from "@/components/retro/score-box";
import { SectionHeader } from "@/components/retro/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dayKey, formatKickoff, isLocked, stageLabel } from "@/lib/format";
import { getMatchById } from "@/lib/queries/matches";
import {
  getMatchPredictions,
  getUserPredictionsMap,
} from "@/lib/queries/predictions";
import { requireUser } from "@/lib/session";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programado",
  live: "En vivo",
  finished: "Finalizado",
  postponed: "Pospuesto",
  cancelled: "Cancelado",
};

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId)) notFound();

  const user = await requireUser();
  const match = await getMatchById(matchId);
  if (!match) notFound();

  const [preds, myMap] = await Promise.all([
    getMatchPredictions(matchId),
    getUserPredictionsMap(user.id),
  ]);

  const hasScore = match.homeScore != null && match.awayScore != null;
  const locked = isLocked(match.kickoff, match.status);
  const iPredicted = myMap.has(matchId);
  // Reveal others once you've committed your own pick (it's then fixed), once the
  // match has started, or always for the admin (the organiser sees everything).
  const reveal = iPredicted || locked || user.role === "admin";

  const sorted = [...preds].sort((a, b) => {
    const pa = a.pointsAwarded ?? -1;
    const pb = b.pointsAwarded ?? -1;
    if (pb !== pa) return pb - pa;
    return playerName(a).localeCompare(playerName(b), "es");
  });

  return (
    <div className="space-y-6">
      <Link
        href="/partidos"
        className="-mx-2 inline-flex min-h-11 items-center gap-1 px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground active:opacity-70"
      >
        <span aria-hidden="true">←</span> Partidos
      </Link>

      <EditorialCard className="space-y-3 p-4">
        <p className="eyebrow text-center">
          {stageLabel(match.stage)}
          {match.groupLetter ? ` · Grupo ${match.groupLetter}` : ""}
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex min-w-0 justify-end text-right">
            <FlagName
              team={match.homeTeam}
              placeholder={match.homePlaceholder}
              className="min-w-0 max-w-full"
            />
          </div>
          <div className="flex flex-col items-center">
            {hasScore ? (
              <ScoreBox
                home={match.homeScore}
                away={match.awayScore}
                homePens={match.homePens}
                awayPens={match.awayPens}
              />
            ) : (
              <span className="stat-num text-2xl text-muted-foreground">vs</span>
            )}
          </div>
          <div className="flex min-w-0 justify-start">
            <FlagName
              team={match.awayTeam}
              placeholder={match.awayPlaceholder}
              className="min-w-0 max-w-full"
            />
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {formatKickoff(match.kickoff)}
          {match.venue ? ` · ${match.venue}` : ""}
        </p>
        <div className="flex justify-center">
          <Badge variant={match.status === "live" ? "default" : "secondary"}>
            {STATUS_LABEL[match.status] ?? match.status}
          </Badge>
        </div>
      </EditorialCard>

      <div>
        <SectionHeader
          eyebrow={`${preds.length} pronóstico${preds.length === 1 ? "" : "s"}`}
          title="Pronósticos"
        />
        {reveal ? (
          preds.length === 0 ? (
            <EditorialCard className="p-6 text-center text-sm text-muted-foreground">
              Nadie pronosticó este partido.
            </EditorialCard>
          ) : (
            <EditorialCard className="mt-2 divide-y divide-border p-0">
              {sorted.map((p) => {
                const mine = p.userId === user.id;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 p-3"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-medium">
                        {playerName(p)}
                      </span>
                      {mine ? <Badge variant="secondary">Vos</Badge> : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="stat-num text-lg tabular-nums">
                        {p.homeScore}–{p.awayScore}
                      </span>
                      {p.pointsAwarded != null ? (
                        <Badge>{p.pointsAwarded} pts</Badge>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </EditorialCard>
          )
        ) : (
          <EditorialCard className="mt-2 space-y-3 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Cargá tu pronóstico para ver los del resto.
            </p>
            <p className="text-sm text-muted-foreground">
              {preds.length} ya cargaron.
            </p>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/pronosticos?day=${dayKey(match.kickoff)}`}>
                Cargar mi pronóstico
              </Link>
            </Button>
          </EditorialCard>
        )}
      </div>
    </div>
  );
}

function playerName(p: {
  user: { displayName: string | null; name: string | null; email: string | null } | null;
}): string {
  return p.user?.displayName || p.user?.name || p.user?.email || "Jugador";
}
