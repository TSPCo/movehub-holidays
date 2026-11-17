import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveRole, getSession } from "@/lib/auth";
import { canApprove } from "@/lib/roles";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canApprove(await getLiveRole(session.sub))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const requests = await db.holidayRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ requests });
}
