import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const requests = await db.holidayRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true } },
    },
  });

  return NextResponse.json({ requests });
}
