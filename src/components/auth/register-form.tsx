"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  passkeysSupported,
  registerWithPasskey,
} from "@/lib/passkey-client";

export function RegisterForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(email.split("@")[0]);

  async function handleRegister() {
    if (!passkeysSupported()) {
      toast.error("Este dispositivo no soporta passkeys.");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Elegí un nombre para mostrar.");
      return;
    }
    setLoading(true);
    try {
      await registerWithPasskey(token, displayName.trim());
      toast.success("¡Listo! Tu passkey quedó registrada.");
      router.push("/tabla");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message ?? "No se pudo registrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 text-sm">
        <p className="text-muted-foreground">Invitación para</p>
        <p className="font-medium">{email}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Tu nombre en la tabla</Label>
        <Input
          id="displayName"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
        />
      </div>
      <Button
        onClick={handleRegister}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        Crear mi passkey
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Usá la huella, la cara o el PIN de tu dispositivo. No hay contraseñas.
      </p>
    </div>
  );
}
