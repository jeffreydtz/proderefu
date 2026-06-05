import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/retro/brand-logo";
import { RequestForm } from "@/components/auth/request-form";
import { getCurrentUser } from "@/lib/session";

export default async function SolicitarPage() {
  const user = await getCurrentUser();
  if (user) redirect("/tabla");

  return (
    <main className="safe-x flex flex-1 flex-col items-center justify-center px-6 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <BrandLogo
            size={40}
            wordmarkClassName="text-2xl [&_.font-display]:text-2xl"
          />
        </div>
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Pedir acceso</h1>
          <p className="text-sm text-muted-foreground">
            Es un pozo privado. Dejá tus datos y el organizador te aprueba.
          </p>
        </div>
        <RequestForm />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés acceso?{" "}
          <Link href="/login" className="font-medium underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
