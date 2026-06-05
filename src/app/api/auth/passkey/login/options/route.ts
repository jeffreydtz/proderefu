import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildLoginOptions,
  CHALLENGE_COOKIE,
  serializeChallenge,
} from "@/lib/passkey";

export async function POST() {
  const { options, payload } = await buildLoginOptions();
  const c = await cookies();
  c.set(CHALLENGE_COOKIE, serializeChallenge(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 300,
  });
  return NextResponse.json(options);
}
