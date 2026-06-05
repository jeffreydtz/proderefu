import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/retro/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/tabla");

  const emailEnabled = Boolean(process.env.EMAIL_SERVER_HOST);

  return (
    <main className="safe-x flex flex-1 flex-col items-center justify-center px-6 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <BrandLogo size={40} wordmarkClassName="text-2xl [&_.font-display]:text-2xl" />
        </div>
        <div className="flex justify-center">
          <Link
            href="/"
            className="-mx-2 inline-flex min-h-11 items-center gap-1 px-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground active:opacity-70"
          >
            <span aria-hidden="true">←</span> Inicio
          </Link>
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground">
            Entrá con tu passkey.
          </p>
        </div>
        <LoginForm emailEnabled={emailEnabled} />
        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés acceso?{" "}
          <Link href="/solicitar" className="font-medium underline">
            Pedí una invitación
          </Link>
        </p>
      </div>
    </main>
  );
}
