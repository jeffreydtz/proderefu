"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  approvePredictionEditAction,
  rejectPredictionEditAction,
} from "./actions";

export function EditApprovalActions({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        className="min-h-11 flex-1 sm:flex-none"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await approvePredictionEditAction(id);
            if (r.ok) toast.success("Edición aprobada · el jugador puede editar una vez.");
            else toast.error(r.error ?? "No se pudo aprobar.");
          })
        }
      >
        Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="min-h-11 flex-1 sm:flex-none"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await rejectPredictionEditAction(id);
            if (r.ok) toast.success("Pedido rechazado.");
            else toast.error(r.error ?? "No se pudo rechazar.");
          })
        }
      >
        Rechazar
      </Button>
    </div>
  );
}
