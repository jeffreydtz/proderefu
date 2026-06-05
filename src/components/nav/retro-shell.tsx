import Link from "next/link";
import { BrandLogo } from "@/components/retro/brand-logo";
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
      <header className="safe-top sticky top-0 z-40 border-b border-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="safe-x mx-auto flex h-14 w-full max-w-5xl items-center gap-2 md:gap-3">
          <MobileNav isAdmin={isAdmin} />
          <Link href="/tabla" aria-label="Prode Mundial 2026 — inicio">
            <BrandLogo size={26} />
          </Link>
          <div className="mx-1 hidden h-6 w-px bg-border md:block" />
          <NavLinks isAdmin={isAdmin} />
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu name={display} isAdmin={isAdmin} />
          </div>
        </div>
      </header>

      <main className="safe-x mx-auto w-full max-w-5xl flex-1 py-6">
        {children}
      </main>

      <footer className="safe-x safe-bottom border-t border-border pt-6 text-center">
        <p className="eyebrow">Prode Mundial 2026 · Solo por invitación</p>
      </footer>
    </div>
  );
}
