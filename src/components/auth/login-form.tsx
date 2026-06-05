"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  loginWithPasskey,
  passkeysSupported,
} from "@/lib/passkey-client";

export function LoginForm({ emailEnabled }: { emailEnabled: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(search.get("check") === "email");
  const [email, setEmail] = useState("");

  async function handlePasskey() {
    if (!passkeysSupported()) {
      toast.error("Este dispositivo no soporta passkeys.");
      return;
    }
    setLoading(true);
    try {
      await loginWithPasskey();
      toast.success("¡Bienvenido!");
      router.push("/tabla");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message ?? "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await signIn("nodemailer", {
        email: email.trim().toLowerCase(),
        redirect: false,
        callbackUrl: "/tabla",
      });
      setEmailSent(true);
    } catch {
      toast.error("No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-sm">
        <p className="font-medium">Revisá tu correo 📬</p>
        <p className="mt-1 text-muted-foreground">
          Si tu email está invitado, te llegó un link para entrar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePasskey}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        Entrar con passkey
      </Button>

      {emailEnabled && (
        <>
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">o</span>
            <Separator className="flex-1" />
          </div>
          <form onSubmit={handleEmail} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">¿Perdiste tu dispositivo?</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Enviarme un link por email
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
