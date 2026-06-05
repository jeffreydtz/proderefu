import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces, Big_Shoulders } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_URL } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Warm editorial serif — headlines, team names, logo.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Condensed athletic display — big numbers (points, ratings, scores).
const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  subsets: ["latin"],
  display: "swap",
});

const DESCRIPTION =
  "Prode privado del Mundial 2026 — pronósticos, fixture, tabla y llave.";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: "Prode Mundial 2026",
  title: {
    default: "Prode Mundial 2026",
    template: "%s · Prode Mundial 2026",
  },
  description: DESCRIPTION,
  appleWebApp: { capable: true, title: "Prode '26", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Prode Mundial 2026",
    title: "Prode Mundial 2026",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Prode Mundial 2026",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2E9D0" },
    { media: "(prefers-color-scheme: dark)", color: "#26221B" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${bigShoulders.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
