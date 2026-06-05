import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/session";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/tabla");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Prode privado
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">Mundial 2026 ⚽</h1>
        <p className="mx-auto max-w-md text-balance text-muted-foreground">
          Pronosticá los partidos, sumá puntos y peleá la tabla con tus amigos.
          Acceso solo con invitación.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/login">Entrar</Link>
      </Button>
      <p className="text-xs text-muted-foreground">
        ¿No tenés acceso? Pedile el link de invitación al organizador.
      </p>
    </main>
  );
}
