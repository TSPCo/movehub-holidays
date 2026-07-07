import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchMonthRequests } from "@/lib/calendarData";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const monthParam = request.nextUrl.searchParams.get("month"); // "YYYY-MM"
  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  const requests = await fetchMonthRequests(year, month);

  return NextResponse.json({ requests });
}
