import { desc } from "drizzle-orm";
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
import { invites, users } from "@/db/schema";
import { OWNER_EMAIL } from "@/lib/env";
import { emailConfigured } from "@/lib/mail";
import { requireAdmin } from "@/lib/session";
import { InviteActions } from "./invite-actions";
import { InviteForm } from "./invite-form";
import { PlayerActions } from "./player-actions";
import { RequestActions } from "./request-actions";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  registered: "Registrado",
  revoked: "Revocada",
  requested: "Solicitó",
};

function statusVariant(s: string): "default" | "secondary" | "outline" {
  if (s === "registered") return "default";
  if (s === "revoked") return "outline";
  return "secondary";
}

export default async function JugadoresPage() {
  const admin = await requireAdmin();
  const [inviteList, players] = await Promise.all([
    db.query.invites.findMany({ orderBy: [desc(invites.createdAt)] }),
    db.query.users.findMany({ orderBy: [desc(users.createdAt)] }),
  ]);

  const requests = inviteList.filter((i) => i.status === "requested");
  const openInvites = inviteList.filter(
    (i) => i.status === "pending" || i.status === "revoked",
  );

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Pozo cerrado · con aprobación" title="Jugadores" />

      {/* --- Access requests --- */}
      {requests.length > 0 ? (
        <div>
          <Eyebrow>Solicitudes de acceso ({requests.length})</Eyebrow>
          <EditorialCard className="mt-2 divide-y divide-border p-0">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{r.name ?? r.email}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {r.email}
                  </p>
                </div>
                <RequestActions id={r.id} />
              </div>
            ))}
          </EditorialCard>
        </div>
      ) : null}

      {/* --- Invite by email --- */}
      <EditorialCard className="space-y-3 p-4">
        <Eyebrow>Invitar jugador</Eyebrow>
        <InviteForm />
        <p className="text-xs text-muted-foreground">
          {emailConfigured
            ? "Se envía un email con el link. También podés copiarlo."
            : "SMTP no configurado: copiá el link y mandáselo vos."}
        </p>
      </EditorialCard>

      {/* --- Registered players --- */}
      <div>
        <Eyebrow>Jugadores ({players.length})</Eyebrow>
        <EditorialCard className="mt-2 divide-y divide-border p-0">
          {players.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Todavía no se registró nadie.
            </p>
          ) : (
            players.map((p) => {
              const display = p.displayName || p.name || p.email || "Jugador";
              const isOwner = p.email?.toLowerCase() === OWNER_EMAIL;
              const removable = p.id !== admin.id && !isOwner;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 p-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate font-medium">
                      <span className="truncate">{display}</span>
                      {p.role === "admin" ? (
                        <Badge variant="secondary">Admin</Badge>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {p.email}
                    </p>
                  </div>
                  {removable ? (
                    <PlayerActions userId={p.id} name={display} />
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.id === admin.id ? "vos" : "organizador"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </EditorialCard>
      </div>

      {/* --- Invitations (pending / revoked) --- */}
      <div>
        <Eyebrow>Invitaciones ({openInvites.length})</Eyebrow>
        <EditorialCard className="mt-2 overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openInvites.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-sm text-muted-foreground"
                  >
                    No hay invitaciones pendientes.
                  </TableCell>
                </TableRow>
              ) : (
                openInvites.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="max-w-[55vw] truncate font-medium">
                      {inv.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(inv.status)}>
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <InviteActions id={inv.id} status={inv.status} />
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
