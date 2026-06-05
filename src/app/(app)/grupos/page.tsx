import { EditorialCard } from "@/components/retro/editorial-card";
import { FlagName } from "@/components/retro/flag-name";
import { SectionHeader } from "@/components/retro/section-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getGroupTables } from "@/lib/standings/service";
import type { GroupTable } from "@/lib/standings/groups";
import { cn } from "@/lib/utils";

export default async function GruposPage() {
  const tables = await getGroupTables();

  if (!tables.length) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Fase de grupos" title="Grupos" />
        <EditorialCard className="p-8 text-center text-sm text-muted-foreground">
          Todavía no hay grupos cargados.
        </EditorialCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Fase de grupos" title="Grupos" />
      <div className="grid gap-4 sm:grid-cols-2">
        {tables.map((t) => (
          <GroupCard key={t.letter} table={t} />
        ))}
      </div>
      <p className="eyebrow">
        Verde = clasifican (1° y 2°) · Dorado = mejor tercero
      </p>
    </div>
  );
}

function GroupCard({ table }: { table: GroupTable }) {
  return (
    <EditorialCard className="overflow-hidden">
      <div className="border-b border-foreground bg-secondary px-3 py-2 font-display text-base font-bold">
        Grupo {table.letter}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8 text-center">#</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="hidden text-center sm:table-cell">PJ</TableHead>
            <TableHead className="hidden text-center sm:table-cell">G</TableHead>
            <TableHead className="hidden text-center sm:table-cell">E</TableHead>
            <TableHead className="hidden text-center sm:table-cell">P</TableHead>
            <TableHead className="text-center">DG</TableHead>
            <TableHead className="text-center font-bold">Pts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((r) => {
            const qual = r.rank <= 2;
            const third = r.rank === 3;
            return (
              <TableRow key={r.team.id}>
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "inline-grid size-5 place-items-center rounded-full text-xs font-bold",
                      qual && "bg-grass text-grass-foreground",
                      third && "bg-gold text-gold-foreground",
                      !qual && !third && "text-muted-foreground",
                    )}
                  >
                    {r.rank}
                  </span>
                </TableCell>
                <TableCell>
                  <FlagName team={r.team} size="sm" />
                </TableCell>
                <TableCell className="hidden text-center sm:table-cell">
                  {r.played}
                </TableCell>
                <TableCell className="hidden text-center sm:table-cell">
                  {r.won}
                </TableCell>
                <TableCell className="hidden text-center sm:table-cell">
                  {r.drawn}
                </TableCell>
                <TableCell className="hidden text-center sm:table-cell">
                  {r.lost}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {r.gd > 0 ? `+${r.gd}` : r.gd}
                </TableCell>
                <TableCell className="text-center font-bold tabular-nums">
                  {r.points}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </EditorialCard>
  );
}
