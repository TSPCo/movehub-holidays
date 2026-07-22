import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Machine-to-machine endpoint for other Move Hub apps — not session-authenticated. */
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get("x-availability-api-key");
  if (!apiKey || apiKey !== process.env.AVAILABILITY_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dateParam = request.nextUrl.searchParams.get("date"); // "YYYY-MM-DD", defaults to today
  const date = dateParam ? new Date(`${dateParam}T00:00:00.000Z`) : new Date();
  const dateUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

  if (Number.isNaN(dateUtc.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const requests = await db.holidayRequest.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { lte: dateUtc },
      endDate: { gte: dateUtc },
    },
    include: { user: { select: { email: true, name: true } } },
  });

  const onLeave = requests.map((r) => ({
    email: r.user.email.toLowerCase(),
    name: r.user.name,
    status: r.status,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
  }));

  return NextResponse.json({ date: dateUtc.toISOString().slice(0, 10), onLeave });
}
