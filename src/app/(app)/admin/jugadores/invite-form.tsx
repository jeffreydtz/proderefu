"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invitePlayerAction, type InviteResult } from "./actions";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Invitando…" : "Invitar"}
    </Button>
  );
}

export function InviteForm() {
  const [state, action] = useActionState<InviteResult | null, FormData>(
    invitePlayerAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(
        state.emailed
          ? "Invitación enviada por email."
          : "Invitación creada — copiá el link.",
      );
    } else {
      toast.error(state.error ?? "No se pudo invitar.");
    }
  }, [state]);

  return (
    <div className="space-y-2">
      <form action={action} className="flex flex-col gap-2 sm:flex-row">
        <Input
          name="email"
          type="email"
          placeholder="amigo@email.com"
          required
          className="sm:max-w-xs"
        />
        <SubmitBtn />
      </form>
      {state?.ok && state.inviteUrl ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-2 text-xs">
          <code className="flex-1 truncate">{state.inviteUrl}</code>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(state.inviteUrl!);
              toast.success("Link copiado.");
            }}
          >
            Copiar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
