import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Personal details a staff member can edit on their own record. Deliberately
// excludes role/status/allowanceDays/password — those stay admin-only via
// /api/admin/users/[id].
const DETAIL_STRING_FIELDS = [
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "postcode",
  "emergencyContactName",
  "emergencyContactPhone",
] as const;

const SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  dateOfBirth: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  postcode: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.sub }, select: SELECT });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const data: Record<string, unknown> = {};

  for (const field of DETAIL_STRING_FIELDS) {
    if (typeof body?.[field] === "string") data[field] = body[field].trim() || null;
  }

  if ("dateOfBirth" in (body ?? {})) {
    data.dateOfBirth =
      typeof body.dateOfBirth === "string" && body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }

  const user = await db.user.update({
    where: { id: session.sub },
    data,
    select: SELECT,
  });

  return NextResponse.json({ user });
}
