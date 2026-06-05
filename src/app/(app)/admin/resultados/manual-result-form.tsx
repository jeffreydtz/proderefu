"use client";

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
    <Button type="submit" size="sm" disabled={pending}>
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
    <form action={action} className="flex flex-wrap items-center gap-2 py-1">
      <input type="hidden" name="matchId" value={matchId} />
      <span className="w-24 truncate text-right text-sm font-medium sm:w-32">
        {home}
      </span>
      <Input
        name="home"
        type="number"
        min={0}
        max={99}
        defaultValue={homeScore ?? ""}
        className="h-9 w-12 text-center"
        aria-label="Goles local"
      />
      <span className="text-muted-foreground">–</span>
      <Input
        name="away"
        type="number"
        min={0}
        max={99}
        defaultValue={awayScore ?? ""}
        className="h-9 w-12 text-center"
        aria-label="Goles visitante"
      />
      <span className="w-24 truncate text-sm font-medium sm:w-32">{away}</span>

      {knockout ? (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          pen
          <Input
            name="homePens"
            type="number"
            min={0}
            max={99}
            defaultValue={homePens ?? ""}
            className="h-8 w-10 text-center"
            aria-label="Penales local"
          />
          -
          <Input
            name="awayPens"
            type="number"
            min={0}
            max={99}
            defaultValue={awayPens ?? ""}
            className="h-8 w-10 text-center"
            aria-label="Penales visitante"
          />
        </span>
      ) : null}

      <SaveBtn />

      {locked ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={unlocking}
          onClick={() =>
            startUnlock(async () => {
              await clearManualLockAction(matchId);
              toast.success("Desbloqueado — la sync vuelve a mandar.");
            })
          }
        >
          🔒 Desbloquear
        </Button>
      ) : null}
    </form>
  );
}
