"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  recomputeAllAction,
  runSyncNowAction,
  toggleSyncAction,
  updateScoringSettingsAction,
  type ScoringState,
} from "./actions";

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar puntaje"}
    </Button>
  );
}

export function ScoringForm({
  exact,
  outcome,
}: {
  exact: number;
  outcome: number;
}) {
  const [state, action] = useActionState<ScoringState | null, FormData>(
    updateScoringSettingsAction,
    null,
  );
  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Puntaje actualizado y recalculado.");
    else toast.error(state.error ?? "Error.");
  }, [state]);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="exact">Puntos por exacto</Label>
        <Input
          id="exact"
          name="exact"
          type="number"
          min={0}
          max={20}
          defaultValue={exact}
          className="w-20"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="outcome">Puntos por resultado</Label>
        <Input
          id="outcome"
          name="outcome"
          type="number"
          min={0}
          max={20}
          defaultValue={outcome}
          className="w-20"
        />
      </div>
      <SaveBtn />
    </form>
  );
}

export function SyncControls({ syncEnabled }: { syncEnabled: boolean }) {
  const [enabled, setEnabled] = useState(syncEnabled);
  const [pToggle, sToggle] = useTransition();
  const [pSync, sSync] = useTransition();
  const [pRecalc, sRecalc] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={pToggle}
        onClick={() =>
          sToggle(async () => {
            const r = await toggleSyncAction();
            setEnabled(r.enabled);
            toast.success(r.enabled ? "Sync activada." : "Sync pausada.");
          })
        }
      >
        {enabled ? "Pausar sync" : "Activar sync"}
      </Button>
      <Button
        variant="outline"
        disabled={pSync}
        onClick={() =>
          sSync(async () => {
            const r = await runSyncNowAction();
            toast[r.error ? "error" : "success"](
              r.error
                ? `Sync con error: ${r.error}`
                : `Sync OK · ${r.updated} partido(s) actualizados.`,
            );
          })
        }
      >
        Sincronizar ahora
      </Button>
      <Button
        variant="outline"
        disabled={pRecalc}
        onClick={() =>
          sRecalc(async () => {
            const r = await recomputeAllAction();
            toast.success(`Recalculado: ${r.updated} pronóstico(s).`);
          })
        }
      >
        Recalcular puntos
      </Button>
    </div>
  );
}
