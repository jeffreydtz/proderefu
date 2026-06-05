"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removePlayerAction } from "./actions";

export function PlayerActions({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="destructive"
      className="min-h-11"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `¿Eliminar a ${name}? Se borran sus pronósticos y queda fuera de la tabla. No se puede deshacer.`,
          )
        )
          return;
        start(async () => {
          const r = await removePlayerAction(userId);
          if (r.ok) toast.success("Jugador eliminado.");
          else toast.error(r.error ?? "No se pudo eliminar.");
        });
      }}
    >
      Eliminar
    </Button>
  );
}
