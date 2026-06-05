import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { runSync } from "@/lib/sync/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel daily cron: full reconcile (ignores the match window) + keeps the
// Neon database warm.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await runSync("vercel-daily", true);
  return NextResponse.json(result);
}

export const POST = GET;
