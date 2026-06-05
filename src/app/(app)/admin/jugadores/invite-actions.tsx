"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendInviteAction, revokeInviteAction } from "./actions";

export function InviteActions({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await resendInviteAction(id);
            if (r.ok && r.inviteUrl) {
              navigator.clipboard.writeText(r.inviteUrl);
              toast.success(
                r.emailed
                  ? "Reenviado por email · link copiado."
                  : "Link copiado.",
              );
            } else {
              toast.error(r.error ?? "Error al reenviar.");
            }
          })
        }
      >
        Reenviar
      </Button>
      {status !== "revoked" ? (
        <Button
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await revokeInviteAction(id);
              toast.success("Invitación revocada.");
            })
          }
        >
          Revocar
        </Button>
      ) : null}
    </div>
  );
}
