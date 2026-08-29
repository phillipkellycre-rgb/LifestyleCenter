import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { emptyState } from "@/lib/domain/seed";
import type { Db } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const SINGLETON_ID = "singleton";

export async function GET() {
  const row = await prisma.appState.findUnique({ where: { id: SINGLETON_ID } });
  if (row) return NextResponse.json(row.data);

  // Nothing exists yet — create it. Two first-ever requests can race here
  // (e.g. React Strict Mode's double effect invocation, or two devices
  // opening a brand-new account at the same instant); if another request
  // won the create, just read back what it wrote instead of erroring.
  const fresh = emptyState();
  try {
    const created = await prisma.appState.create({
      data: { id: SINGLETON_ID, data: fresh as unknown as Prisma.InputJsonValue },
    });
    return NextResponse.json(created.data);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.appState.findUnique({ where: { id: SINGLETON_ID } });
      if (existing) return NextResponse.json(existing.data);
    }
    throw err;
  }
}

export async function PUT(req: NextRequest) {
  let body: Db;
  try {
    body = (await req.json()) as Db;
  } catch {
    return NextResponse.json({ error: "Malformed JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !body.profile) {
    return NextResponse.json({ error: "Request body is not a valid app state." }, { status: 400 });
  }
  await prisma.appState.upsert({
    where: { id: SINGLETON_ID },
    update: { data: body as unknown as Prisma.InputJsonValue },
    create: { id: SINGLETON_ID, data: body as unknown as Prisma.InputJsonValue },
  });
  return NextResponse.json({ ok: true });
}
