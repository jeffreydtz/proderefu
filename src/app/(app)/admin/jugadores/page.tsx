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
import { invites } from "@/db/schema";
import { emailConfigured } from "@/lib/mail";
import { InviteActions } from "./invite-actions";
import { InviteForm } from "./invite-form";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  registered: "Registrado",
  revoked: "Revocada",
};

function statusVariant(s: string): "default" | "secondary" | "outline" {
  if (s === "registered") return "default";
  if (s === "revoked") return "outline";
  return "secondary";
}

export default async function JugadoresPage() {
  const inviteList = await db.query.invites.findMany({
    orderBy: [desc(invites.createdAt)],
  });
  const registered = inviteList.filter((i) => i.status === "registered").length;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Pozo cerrado · solo invitados"
        title="Jugadores"
      />

      <EditorialCard className="space-y-3 p-4">
        <Eyebrow>Invitar jugador</Eyebrow>
        <InviteForm />
        <p className="text-xs text-muted-foreground">
          {emailConfigured
            ? "Se envía un email con el link. También podés copiarlo."
            : "SMTP no configurado: copiá el link y mandáselo vos."}
        </p>
      </EditorialCard>

      <div>
        <Eyebrow>
          Invitaciones ({inviteList.length}) · Registrados ({registered})
        </Eyebrow>
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
              {inviteList.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Todavía no invitaste a nadie.
                  </TableCell>
                </TableRow>
              ) : (
                inviteList.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(inv.status)}>
                        {STATUS_LABEL[inv.status] ?? inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
