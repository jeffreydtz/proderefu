"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Two coherent warm themes: cream "paper" (light) and floodlit espresso (dark).
 * Defaults to light; users can toggle and the choice is remembered.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
