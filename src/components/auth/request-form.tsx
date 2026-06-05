"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestAccessAction,
  type RequestResult,
  type RequestState,
} from "@/app/solicitar/actions";

const MESSAGES: Record<RequestState, string> = {
  created:
    "¡Listo! Tu solicitud le llegó al organizador. Te avisamos cuando te apruebe.",
  already_requested:
    "Ya tenías una solicitud pendiente — el organizador la va a revisar.",
  already_approved:
    "¡Ya estás aprobado! Volvé al inicio y registrá tu passkey.",
  already_registered: "Ya tenés cuenta. Iniciá sesión.",
};

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Enviando…" : "Pedir acceso"}
    </Button>
  );
}

export function RequestForm() {
  const [state, action] = useActionState<RequestResult | null, FormData>(
    requestAccessAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success(MESSAGES[state.state ?? "created"]);
    else toast.error(state.error ?? "No se pudo enviar la solicitud.");
  }, [state]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Tu nombre</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          maxLength={40}
          required
          placeholder="Como querés aparecer en la tabla"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Tu email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="tu@email.com"
        />
      </div>
      <SubmitBtn />
      {state?.ok ? (
        <p className="text-center text-sm text-muted-foreground">
          {MESSAGES[state.state ?? "created"]}
        </p>
      ) : null}
    </form>
  );
}
