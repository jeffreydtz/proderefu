import { count, desc, isNull, or } from "drizzle-orm";
import { EditorialCard } from "@/components/retro/editorial-card";
import { Eyebrow } from "@/components/retro/eyebrow";
import { SectionHeader } from "@/components/retro/section-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { db } from "@/db";
import { matches, syncLog } from "@/db/schema";
import { formatKickoff } from "@/lib/format";
import { ScoringForm, SyncControls } from "./admin-controls";

export default async function AjustesPage() {
  const [config, logs, unresolvedRow] = await Promise.all([
    db.query.settings.findFirst(),
    db.query.syncLog.findMany({ orderBy: [desc(syncLog.ranAt)], limit: 8 }),
    db
      .select({ c: count() })
      .from(matches)
      .where(or(isNull(matches.homeTeamId), isNull(matches.awayTeamId))),
  ]);

  const exact = config?.pointsExact ?? 3;
  const outcome = config?.pointsOutcome ?? 1;
  const syncEnabled = config?.syncEnabled ?? true;
  const provider = config?.syncProvider ?? "footballData";
  const unresolved = Number(unresolvedRow[0]?.c ?? 0);
  const lastSync = logs[0];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Configuración" title="Ajustes" />

      <EditorialCard className="space-y-3 p-4">
        <Eyebrow>Puntaje</Eyebrow>
        <ScoringForm exact={exact} outcome={outcome} />
        <p className="text-xs text-muted-foreground">
          Cambiar el puntaje recalcula todos los pronósticos ya jugados.
        </p>
      </EditorialCard>

      <EditorialCard className="space-y-3 p-4">
        <Eyebrow>Sincronización</Eyebrow>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant={syncEnabled ? "default" : "outline"}>
            {syncEnabled ? "Activada" : "Pausada"}
          </Badge>
          <span className="text-muted-foreground">Proveedor: {provider}</span>
          {lastSync ? (
            <span className="text-muted-foreground">
              · Última: {formatKickoff(lastSync.ranAt)} (
              {lastSync.matchesUpdated} act.)
            </span>
          ) : (
            <span className="text-muted-foreground">· Sin sync aún</span>
          )}
          {unresolved > 0 ? (
            <span className="text-muted-foreground">
              · {unresolved} partido(s) con equipos sin definir
            </span>
          ) : null}
        </div>
        <SyncControls syncEnabled={syncEnabled} />
      </EditorialCard>

      <div>
        <Eyebrow>Historial de sync</Eyebrow>
        <EditorialCard className="mt-2 p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuándo</TableHead>
                <TableHead className="hidden sm:table-cell">Origen</TableHead>
                <TableHead className="hidden text-center sm:table-cell">
                  Actuó
                </TableHead>
                <TableHead className="text-center">Actualizados</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Sin registros.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">
                      {formatKickoff(l.ranAt)}
                    </TableCell>
                    <TableCell className="hidden text-xs sm:table-cell">
                      {l.source}
                    </TableCell>
                    <TableCell className="hidden text-center sm:table-cell">
                      {l.acted ? "sí" : "no"}
                    </TableCell>
                    <TableCell className="text-center">
                      {l.matchesUpdated}
                    </TableCell>
                    <TableCell className="max-w-[12rem] whitespace-normal break-words text-xs text-destructive">
                      {l.error ?? ""}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </EditorialCard>
      </div>
    </div>
  );
}
