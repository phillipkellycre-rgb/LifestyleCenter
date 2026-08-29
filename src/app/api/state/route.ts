import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emptyState } from "@/lib/domain/seed";
import type { Db } from "@/lib/domain/types";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const SINGLETON_ID = "singleton";

export async function GET() {
  const row = await prisma.appState.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) {
    const fresh = emptyState();
    await prisma.appState.create({
      data: { id: SINGLETON_ID, data: fresh as unknown as Prisma.InputJsonValue },
    });
    return NextResponse.json(fresh);
  }
  return NextResponse.json(row.data);
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
