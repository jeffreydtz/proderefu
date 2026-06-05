import Link from "next/link";
import { CalendarClock, Settings, Trophy, Users } from "lucide-react";
import { count, desc, eq } from "drizzle-orm";
import { EditorialCard } from "@/components/retro/editorial-card";
import { Eyebrow } from "@/components/retro/eyebrow";
import { SectionHeader } from "@/components/retro/section-header";
import { StatNumber } from "@/components/retro/stat-number";
import { db } from "@/db";
import { invites, matches, syncLog } from "@/db/schema";
import { formatKickoff } from "@/lib/format";

const LINKS = [
  {
    href: "/admin/jugadores",
    title: "Jugadores",
    desc: "Invitar y administrar el pozo",
    icon: Users,
  },
  {
    href: "/admin/resultados",
    title: "Resultados",
    desc: "Cargar marcadores a mano",
    icon: Trophy,
  },
  {
    href: "/admin/ajustes",
    title: "Ajustes",
    desc: "Puntaje, sync y recálculo",
    icon: Settings,
  },
];

export default async function AdminDashboard() {
  const [playersRow, finishedRow, totalRow, lastSync] = await Promise.all([
    db.select({ c: count() }).from(invites).where(eq(invites.status, "registered")),
    db.select({ c: count() }).from(matches).where(eq(matches.status, "finished")),
    db.select({ c: count() }).from(matches),
    db.query.syncLog.findMany({ orderBy: [desc(syncLog.ranAt)], limit: 1 }),
  ]);

  const players = Number(playersRow[0]?.c ?? 0);
  const finished = Number(finishedRow[0]?.c ?? 0);
  const total = Number(totalRow[0]?.c ?? 0);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Panel del organizador" title="Admin" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Tile label="Jugadores" value={players} />
        <Tile label="Partidos jugados" value={`${finished}/${total}`} />
        <Tile
          label="Última sync"
          value={
            lastSync[0] ? (
              <span className="text-sm font-normal">
                {formatKickoff(lastSync[0].ranAt)}
              </span>
            ) : (
              "—"
            )
          }
          small
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href}>
            <EditorialCard className="flex h-full items-center gap-3 p-4 transition-colors hover:bg-accent">
              <l.icon className="size-6 shrink-0 text-primary" />
              <div>
                <p className="font-display font-semibold">{l.title}</p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
            </EditorialCard>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  small = false,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <EditorialCard className="flex flex-col items-center gap-1 p-4 text-center">
      {small ? (
        <div className="flex h-9 items-center">
          <CalendarClock className="mr-1 size-4 text-muted-foreground" />
          {value}
        </div>
      ) : (
        <StatNumber value={value} size="lg" />
      )}
      <Eyebrow>{label}</Eyebrow>
    </EditorialCard>
  );
}
