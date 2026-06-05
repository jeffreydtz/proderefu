"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorialCard } from "@/components/retro/editorial-card";
import { FlagName } from "@/components/retro/flag-name";
import { ScoreBox } from "@/components/retro/score-box";
import { formatTime, isLocked } from "@/lib/format";
import { phaseOfStage } from "@/lib/phase";
import type { MatchWithTeams } from "@/lib/queries/matches";
import {
  requestPredictionEditAction,
  savePredictionsAction,
  type SaveResult,
} from "./actions";

type PredMap = Record<
  number,
  {
    homeScore: number;
    awayScore: number;
    editRequestedAt: Date | null;
    editApprovedAt: Date | null;
  }
>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full sm:w-auto">
      {pending ? "Guardando…" : "Guardar pronósticos"}
    </Button>
  );
}

function EditRequestButton({ matchId }: { matchId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="min-h-9"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await requestPredictionEditAction(matchId);
          if (r.ok) {
            toast.success("Pedido de edición enviado al organizador.");
            router.refresh();
          } else {
            toast.error(r.error ?? "No se pudo pedir la edición.");
          }
        })
      }
    >
      Pedir editar
    </Button>
  );
}

export function PronosticosDayForm({
  matches,
  predictions,
  groupStageComplete,
}: {
  matches: MatchWithTeams[];
  predictions: PredMap;
  groupStageComplete: boolean;
}) {
  const [state, formAction] = useActionState<SaveResult | null, FormData>(
    savePredictionsAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.saved > 0)
      toast.success(
        `Guardado: ${state.saved} pronóstico${state.saved > 1 ? "s" : ""}.`,
      );
    if (state.rejected.length)
      toast.warning(
        `${state.rejected.length} partido(s) ya cerrados — no se guardaron.`,
      );
    if (state.saved === 0 && state.rejected.length === 0)
      toast.info("No había cambios para guardar.");
  }, [state]);

  const isPhaseLocked = (m: MatchWithTeams) =>
    m.status === "scheduled" &&
    phaseOfStage(m.stage) !== "group" &&
    !groupStageComplete;
  const anyOpen = matches.some((m) => {
    const pred = predictions[m.id];
    return (
      !isLocked(m.kickoff, m.status) &&
      !isPhaseLocked(m) &&
      (!pred || !!pred.editApprovedAt)
    );
  });

  return (
    <form action={formAction} className="space-y-3">
      <EditorialCard className="divide-y divide-border">
        {matches.map((m) => {
          const phaseLocked = isPhaseLocked(m);
          const matchClosed = isLocked(m.kickoff, m.status);
          const pred = predictions[m.id];
          const editApproved = !!pred?.editApprovedAt;
          const editRequested = !!pred?.editRequestedAt && !editApproved;
          const showInputs =
            !matchClosed && !phaseLocked && (!pred || editApproved);
          return (
            <div
              key={m.id}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 p-3 sm:gap-4"
            >
              <div className="flex min-w-0 items-center justify-end text-right">
                <FlagName
                  team={m.homeTeam}
                  placeholder={m.homePlaceholder}
                  className="min-w-0 max-w-full"
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                {showInputs ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Input
                        name={`m_${m.id}_home`}
                        type="number"
                        min={0}
                        max={99}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        defaultValue={pred?.homeScore ?? ""}
                        className="h-11 w-14 text-center text-lg tabular-nums"
                        aria-label="Goles local"
                      />
                      <span className="text-muted-foreground">–</span>
                      <Input
                        name={`m_${m.id}_away`}
                        type="number"
                        min={0}
                        max={99}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        defaultValue={pred?.awayScore ?? ""}
                        className="h-11 w-14 text-center text-lg tabular-nums"
                        aria-label="Goles visitante"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {editApproved ? "Edición habilitada · guardá" : formatTime(m.kickoff)}
                    </span>
                  </>
                ) : (
                  <>
                    {m.status === "finished" ? (
                      <ScoreBox
                        home={m.homeScore}
                        away={m.awayScore}
                        homePens={m.homePens}
                        awayPens={m.awayPens}
                        size="sm"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {formatTime(m.kickoff)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Lock className="size-3" />
                      {phaseLocked
                        ? "Al terminar grupos"
                        : pred
                          ? `Tu pron.: ${pred.homeScore}-${pred.awayScore}`
                          : "Sin pronóstico"}
                    </span>
                    {!matchClosed && !phaseLocked && pred ? (
                      editRequested ? (
                        <span className="text-xs text-muted-foreground">
                          Edición solicitada
                        </span>
                      ) : (
                        <EditRequestButton matchId={m.id} />
                      )
                    ) : null}
                  </>
                )}
              </div>

              <div className="flex min-w-0 items-center justify-start">
                <FlagName
                  team={m.awayTeam}
                  placeholder={m.awayPlaceholder}
                  className="min-w-0 max-w-full"
                />
              </div>
            </div>
          );
        })}
      </EditorialCard>

      {anyOpen ? (
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Todos los partidos de este día están cerrados.
        </p>
      )}
    </form>
  );
}
