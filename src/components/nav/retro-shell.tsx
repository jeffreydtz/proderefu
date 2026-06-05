import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

type ShellUser = {
  name?: string | null;
  email?: string | null;
  role?: "admin" | "player" | null;
};

export function RetroShell({
  user,
  children,
}: {
  user: ShellUser;
  children: React.ReactNode;
}) {
  const isAdmin = user.role === "admin";
  const display = user.name || user.email?.split("@")[0] || "Jugador";

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b border-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <MobileNav isAdmin={isAdmin} />
          <Link href="/tabla" className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-black tracking-tight">
              PRODE
            </span>
            <span className="rounded bg-gold px-1.5 font-stat text-lg leading-none text-gold-foreground">
              &apos;26
            </span>
          </Link>
          <div className="mx-1 hidden h-6 w-px bg-border md:block" />
          <NavLinks isAdmin={isAdmin} />
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu name={display} isAdmin={isAdmin} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border py-6 text-center">
        <p className="eyebrow">Prode Mundial 2026 · Solo por invitación</p>
      </footer>
    </div>
  );
}
