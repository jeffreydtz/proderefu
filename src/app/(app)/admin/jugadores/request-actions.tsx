"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { approveRequestAction, rejectRequestAction } from "./actions";

export function RequestActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        className="min-h-11 flex-1 sm:flex-none"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await approveRequestAction(id);
            if (r.ok) {
              if (r.inviteUrl)
                navigator.clipboard.writeText(r.inviteUrl).catch(() => {});
              toast.success(
                r.emailed
                  ? "Aprobado · le mandamos el link por email."
                  : "Aprobado · link copiado para enviarle.",
              );
            } else {
              toast.error(r.error ?? "No se pudo aprobar.");
            }
          })
        }
      >
        Aceptar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="min-h-11 flex-1 sm:flex-none"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await rejectRequestAction(id);
            toast.success("Solicitud rechazada.");
          })
        }
      >
        Rechazar
      </Button>
    </div>
  );
}
