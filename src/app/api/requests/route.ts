import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { countWorkingDays } from "@/lib/holidays";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await db.holidayRequest.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const startDateRaw = body?.startDate;
  const endDateRaw = body?.endDate;
  const notes = typeof body?.notes === "string" ? body.notes.trim() || null : null;

  if (!startDateRaw || !endDateRaw) {
    return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
  }

  const startDate = new Date(startDateRaw);
  const endDate = new Date(endDateRaw);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: "End date must be on or after the start date" }, { status: 400 });
  }

  const days = countWorkingDays(startDate, endDate);
  if (days <= 0) {
    return NextResponse.json({ error: "Selected range contains no working days" }, { status: 400 });
  }

  const created = await db.holidayRequest.create({
    data: {
      userId: session.sub,
      startDate,
      endDate,
      days,
      notes,
      status: "PENDING",
    },
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
