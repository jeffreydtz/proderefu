"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDisplayNameAction, type NameResult } from "./actions";

function SaveBtn() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  );
}

export function EditNameForm({ current }: { current: string }) {
  const router = useRouter();
  const [state, action] = useActionState<NameResult | null, FormData>(
    updateDisplayNameAction,
    null,
  );

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success("Nombre actualizado.");
      router.refresh();
    } else {
      toast.error(state.error ?? "No se pudo guardar el nombre.");
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="display-name">Tu nombre en la tabla</Label>
        <Input
          id="display-name"
          name="name"
          defaultValue={current}
          maxLength={40}
          autoComplete="name"
          required
        />
      </div>
      <SaveBtn />
    </form>
  );
}
