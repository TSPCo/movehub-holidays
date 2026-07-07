import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { holidayApprovedEmail, holidayRejectedEmail } from "@/lib/emailTemplates";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const reviewNote = typeof body?.reviewNote === "string" ? body.reviewNote.trim() || null : null;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const existing = await db.holidayRequest.findUnique({ where: { id }, include: { user: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending requests can be reviewed" }, { status: 400 });
  }

  const updated = await db.holidayRequest.update({
    where: { id },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedById: session.sub,
      reviewedAt: new Date(),
      reviewNote,
    },
  });

  const recipientName = existing.user.name ?? existing.user.email;
  const email = action === "approve"
    ? holidayApprovedEmail({ name: recipientName, startDate: existing.startDate, endDate: existing.endDate, days: existing.days })
    : holidayRejectedEmail({ name: recipientName, startDate: existing.startDate, endDate: existing.endDate, reviewNote });

  // Notification is best-effort — a flaky email send shouldn't fail the approval/rejection itself.
  sendEmail({ to: existing.user.email, subject: email.subject, html: email.html }).catch((err) =>
    console.error("[email] Failed to send holiday decision notification:", err)
  );

  return NextResponse.json({ request: updated });
}
