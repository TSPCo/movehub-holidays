import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (body?.action !== "cancel") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const existing = await db.holidayRequest.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.status !== "PENDING" && existing.status !== "APPROVED") {
    return NextResponse.json({ error: "This request can no longer be cancelled" }, { status: 400 });
  }

  const updated = await db.holidayRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ request: updated });
}
