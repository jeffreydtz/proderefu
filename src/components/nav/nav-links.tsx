"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/tabla", label: "Tabla" },
  { href: "/pronosticos", label: "Pronósticos" },
  { href: "/partidos", label: "Partidos" },
  { href: "/grupos", label: "Grupos" },
  { href: "/llave", label: "Llave" },
  { href: "/perfil", label: "Perfil" },
] as const;

export function NavLinks({
  isAdmin = false,
  orientation = "horizontal",
  onNavigate,
}: {
  isAdmin?: boolean;
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const links = isAdmin
    ? [...NAV_LINKS, { href: "/admin", label: "Admin" }]
    : NAV_LINKS;

  return (
    <nav
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-1"
          : "hidden items-center gap-1 md:flex",
      )}
    >
      {links.map((l) => {
        const active =
          pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent active:bg-accent",
              orientation === "vertical"
                ? "flex min-h-11 w-full items-center py-2.5 text-base"
                : "py-1.5",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
