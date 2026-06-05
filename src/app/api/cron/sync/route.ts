import { NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cron-auth";
import { runSync } from "@/lib/sync/run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await runSync("cron");
  return NextResponse.json(result);
}

// Allow POST too (some schedulers default to POST).
export const POST = GET;
