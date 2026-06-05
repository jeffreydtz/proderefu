"use client";

import { Lock } from "lucide-react";
import { useActionState, useEffect, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  clearManualLockAction,
  saveManualResultAction,
  type ResultState,
} from "./actions";

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="min-h-11" disabled={pending}>
      {pending ? "…" : "Guardar"}
    </Button>
  );
}

export function ManualResultForm({
  matchId,
  home,
  away,
  homeScore,
  awayScore,
  homePens,
  awayPens,
  knockout,
  locked,
}: {
  matchId: number;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  homePens: number | null;
  awayPens: number | null;
  knockout: boolean;
  locked: boolean;
}) {
  const [state, action] = useActionState<ResultState | null, FormData>(
    saveManualResultAction,
    null,
  );
  const [unlocking, startUnlock] = useTransition();

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Resultado guardado · puntos recalculados.");
    else toast.error(state.error ?? "Error al guardar.");
  }, [state]);

  return (
    <form action={action} className="space-y-2 py-1">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2">
        <span className="min-w-0 truncate text-right text-sm font-medium">
          {home}
        </span>
        <Input
          name="home"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          max={99}
          defaultValue={homeScore ?? ""}
          className="h-11 w-14 text-center"
          aria-label="Goles local"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          name="away"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          min={0}
          max={99}
          defaultValue={awayScore ?? ""}
          className="h-11 w-14 text-center"
          aria-label="Goles visitante"
        />
        <span className="min-w-0 truncate text-sm font-medium">{away}</span>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {knockout ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            pen
            <Input
              name="homePens"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={99}
              defaultValue={homePens ?? ""}
              className="h-11 w-12 text-center"
              aria-label="Penales local"
            />
            -
            <Input
              name="awayPens"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              max={99}
              defaultValue={awayPens ?? ""}
              className="h-11 w-12 text-center"
              aria-label="Penales visitante"
            />
          </span>
        ) : null}

        {locked ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-11"
            disabled={unlocking}
            aria-label="Desbloquear resultado (la sync vuelve a mandar)"
            onClick={() =>
              startUnlock(async () => {
                await clearManualLockAction(matchId);
                toast.success("Desbloqueado — la sync vuelve a mandar.");
              })
            }
          >
            <Lock className="size-4" />
            Desbloquear
          </Button>
        ) : null}

        <SaveBtn />
      </div>
    </form>
  );
}
