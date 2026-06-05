import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/components/auth/register-form";
import { isExpired } from "@/lib/format";
import { getInviteByToken } from "@/lib/passkey";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  const expired = isExpired(invite?.expiresAt);

  return (
    <main className="safe-x flex flex-1 flex-col items-center justify-center px-6 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(4rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Prode Mundial 2026</h1>
          <p className="text-sm text-muted-foreground">Invitación</p>
        </div>

        {!invite || invite.status === "revoked" ? (
          <Alert
            title="Invitación inválida"
            body="Este link de invitación no existe o fue revocado. Pedile uno nuevo al organizador."
          />
        ) : invite.status === "registered" ? (
          <div className="space-y-4 text-center">
            <Alert
              title="Ya registrada"
              body="Esta invitación ya fue usada. Si sos vos, simplemente iniciá sesión."
            />
            <Button asChild size="lg" className="w-full">
              <Link href="/login">Ir a iniciar sesión</Link>
            </Button>
          </div>
        ) : expired ? (
          <Alert
            title="Invitación expirada"
            body="Este link venció. Pedile uno nuevo al organizador."
          />
        ) : (
          <RegisterForm token={token} email={invite.email} />
        )}
      </div>
    </main>
  );
}

function Alert({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center text-sm">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-muted-foreground">{body}</p>
    </div>
  );
}
