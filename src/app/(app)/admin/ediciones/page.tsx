import { and, isNotNull, isNull } from "drizzle-orm";
import { EditorialCard } from "@/components/retro/editorial-card";
import { FlagName } from "@/components/retro/flag-name";
import { SectionHeader } from "@/components/retro/section-header";
import { db } from "@/db";
import { predictions } from "@/db/schema";
import { formatKickoff, isLocked } from "@/lib/format";
import { EditApprovalActions } from "./edit-actions";

export default async function EdicionesPage() {
  const rows = await db.query.predictions.findMany({
    where: and(
      isNotNull(predictions.editRequestedAt),
      isNull(predictions.editApprovedAt),
    ),
    with: {
      user: {
        columns: { id: true, displayName: true, name: true, email: true },
      },
      match: { with: { homeTeam: true, awayTeam: true } },
    },
  });

  // Only requests for matches that haven't kicked off (otherwise editing is moot).
  const pending = rows
    .filter((r) => r.match && !isLocked(r.match.kickoff, r.match.status))
    .sort(
      (a, b) =>
        (a.editRequestedAt?.getTime() ?? 0) -
        (b.editRequestedAt?.getTime() ?? 0),
    );

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pedidos pendientes" title="Ediciones" />

      {pending.length === 0 ? (
        <EditorialCard className="p-8 text-center text-sm text-muted-foreground">
          No hay pedidos de edición.
        </EditorialCard>
      ) : (
        <EditorialCard className="divide-y divide-border p-0">
          {pending.map((r) => {
            const name =
              r.user?.displayName || r.user?.name || r.user?.email || "Jugador";
            const match = r.match!;
            return (
              <div
                key={r.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FlagName
                      team={match.homeTeam}
                      placeholder={match.homePlaceholder}
                      size="sm"
                      className="min-w-0"
                    />
                    <span className="stat-num shrink-0 tabular-nums">
                      {r.homeScore}–{r.awayScore}
                    </span>
                    <FlagName
                      team={match.awayTeam}
                      placeholder={match.awayPlaceholder}
                      size="sm"
                      className="min-w-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatKickoff(match.kickoff)}
                  </p>
                </div>
                <EditApprovalActions id={r.id} />
              </div>
            );
          })}
        </EditorialCard>
      )}
    </div>
  );
}
