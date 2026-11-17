import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveRole, getSession } from "@/lib/auth";
import { canApprove, reviewerLabel } from "@/lib/roles";
import { sendEmail } from "@/lib/email";
import { holidayApprovedEmail, holidayRejectedEmail } from "@/lib/emailTemplates";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Live DB role, not the session cookie's, so a demoted user loses access immediately.
  const role = await getLiveRole(session.sub);
  if (!canApprove(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
  if (role === "TEAM_LEADER" && existing.userId === session.sub) {
    return NextResponse.json({ error: "Your own request needs approving by an admin or another team leader" }, { status: 403 });
  }

  const updated = await db.holidayRequest.update({
    where: { id },
    data: {
      status: action === "approve" ? "APPROVED" : "REJECTED",
      reviewedById: session.sub,
      reviewedAt: new Date(),
      reviewNote,
    },
    include: { reviewedBy: { select: { name: true, email: true } } },
  });

  const recipientName = existing.user.name ?? existing.user.email;
  const email = action === "approve"
    ? holidayApprovedEmail({ name: recipientName, startDate: existing.startDate, endDate: existing.endDate, days: existing.days })
    : holidayRejectedEmail({ name: recipientName, startDate: existing.startDate, endDate: existing.endDate, reviewNote });

  // Notification is best-effort — a flaky email send shouldn't fail the approval/rejection itself.
  sendEmail({ to: existing.user.email, subject: email.subject, html: email.html }).catch((err) =>
    console.error("[email] Failed to send holiday decision notification:", err)
  );

  const { reviewedBy, ...reviewed } = updated;
  return NextResponse.json({ request: { ...reviewed, reviewedByName: reviewerLabel(reviewedBy) } });
}
