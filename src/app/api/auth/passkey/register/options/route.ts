import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildRegistrationOptions,
  CHALLENGE_COOKIE,
  serializeChallenge,
} from "@/lib/passkey";

export async function POST(req: Request) {
  let token: string | undefined;
  try {
    ({ token } = await req.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  if (!token) {
    return NextResponse.json({ error: "Falta el token de invitación" }, {
      status: 400,
    });
  }
  try {
    const { options, payload } = await buildRegistrationOptions(token);
    const c = await cookies();
    c.set(CHALLENGE_COOKIE, serializeChallenge(payload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 300,
    });
    return NextResponse.json(options);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
