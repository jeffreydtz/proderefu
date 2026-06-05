import { requireUser } from "@/lib/session";
import { RetroShell } from "@/components/nav/retro-shell";

// The whole authenticated app is per-user and auth-gated — never prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <RetroShell user={user}>{children}</RetroShell>;
}
