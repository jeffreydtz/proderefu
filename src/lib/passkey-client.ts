"use client";
import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import { signIn } from "next-auth/react";

export function passkeysSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined"
  );
}

export async function loginWithPasskey() {
  const res = await fetch("/api/auth/passkey/login/options", {
    method: "POST",
  });
  if (!res.ok) throw new Error("No se pudieron obtener las opciones de login.");
  const optionsJSON = await res.json();
  const assertion = await startAuthentication({ optionsJSON });
  const result = await signIn("passkey", {
    response: JSON.stringify(assertion),
    redirect: false,
  });
  if (!result || result.error) {
    throw new Error("No se pudo validar la passkey.");
  }
  return result;
}

export async function registerWithPasskey(token: string, displayName: string) {
  const res = await fetch("/api/auth/passkey/register/options", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "No se pudo iniciar el registro.");
  }
  const attestation = await startRegistration({ optionsJSON: data });
  const result = await signIn("passkey-register", {
    response: JSON.stringify(attestation),
    displayName,
    redirect: false,
  });
  if (!result || result.error) {
    throw new Error("No se pudo registrar la passkey.");
  }
  return result;
}
