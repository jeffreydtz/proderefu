import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/tabla");

  const emailEnabled = Boolean(process.env.EMAIL_SERVER_HOST);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Link href="/" className="text-sm text-muted-foreground">
            ← Inicio
          </Link>
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground">
            Entrá con tu passkey.
          </p>
        </div>
        <LoginForm emailEnabled={emailEnabled} />
      </div>
    </main>
  );
}
