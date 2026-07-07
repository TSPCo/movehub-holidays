import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { INVITE_TTL_MS } from "@/lib/tokens";

const USER_SELECT = { id: true, name: true, email: true, role: true, allowanceDays: true, status: true, createdAt: true } as const;

export async function GET() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: USER_SELECT,
  });
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = body?.role === "ADMIN" ? "ADMIN" : "STAFF";
  const allowanceDays = Number(body?.allowanceDays);

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
  }

  const inviteToken = generateToken();
  const user = await db.user.create({
    data: {
      email,
      role,
      allowanceDays: Number.isFinite(allowanceDays) && allowanceDays > 0 ? allowanceDays : 25,
      status: "INVITED",
      inviteToken,
      inviteTokenExpiry: new Date(Date.now() + INVITE_TTL_MS),
    },
    select: USER_SELECT,
  });

  const inviteUrl = new URL(`/invite/${inviteToken}`, request.nextUrl.origin).toString();

  return NextResponse.json({ user, inviteUrl }, { status: 201 });
}
