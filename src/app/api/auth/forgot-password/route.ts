import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { RESET_TTL_MS } from "@/lib/tokens";
import { getAppUrl } from "@/lib/url";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/emailTemplates";

const GENERIC_MESSAGE = "If an account exists for that email, a reset link is on its way (or an admin has been notified).";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (user && user.status === "ACTIVE") {
    if (user.role === "ADMIN") {
      // Admins approve everyone else's reset requests — there's no one left
      // to approve their own if they're locked out (this app's only admin
      // being unable to reset their own password was a real incident,
      // 2026-07-28). Safe to auto-approve because the link only ever goes
      // to that admin's own registered inbox, same as any standard
      // "forgot password" flow — the thing the manual-approval step for
      // STAFF guards against is a visible link in the API response, not a
      // properly emailed one.
      const token = generateToken();
      await db.passwordResetRequest.create({
        data: { userId: user.id, status: "APPROVED", token, tokenExpiry: new Date(Date.now() + RESET_TTL_MS) },
      });
      const resetUrl = new URL(`/reset-password/${token}`, getAppUrl(request)).toString();
      await sendEmail({ to: user.email, ...passwordResetEmail({ name: user.name ?? user.email, resetUrl }) });
    } else {
      const existingPending = await db.passwordResetRequest.findFirst({
        where: { userId: user.id, status: "PENDING" },
      });
      if (!existingPending) {
        await db.passwordResetRequest.create({ data: { userId: user.id } });
      }
    }
  }

  // Always return the same message, whether or not the account exists, so this endpoint can't be used to enumerate staff emails.
  return NextResponse.json({ message: GENERIC_MESSAGE });
}
