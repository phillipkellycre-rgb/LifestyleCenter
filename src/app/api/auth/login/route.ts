import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, timingSafeEqual } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const expected = process.env.APP_PASSCODE;
  const secret = process.env.APP_SESSION_SECRET;
  if (!expected || !secret) {
    return NextResponse.json(
      { error: "Server is missing APP_PASSCODE / APP_SESSION_SECRET." },
      { status: 500 }
    );
  }

  let passcode = "";
  try {
    const body = (await req.json()) as { passcode?: string };
    passcode = body.passcode ?? "";
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!timingSafeEqual(passcode, expected)) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const token = await createSessionToken(secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
