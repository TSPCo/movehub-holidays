export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await requireAdmin();

  const now = new Date();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const yearEnd = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59));

  const [users, resetRequests, usedByUser] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        allowanceDays: true,
        status: true,
        createdAt: true,
        peerDeleteRequestedAt: true,
        peerDeleteRequestedFrom: true,
        phone: true,
        dateOfBirth: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postcode: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
      },
    }),
    db.passwordResetRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    // Approved days taken this calendar year, per user — the allowance is scoped to the
    // current year, so this (and therefore "remaining") naturally resets every 1 January.
    db.holidayRequest.groupBy({
      by: ["userId"],
      where: { status: "APPROVED", startDate: { gte: yearStart }, endDate: { lte: yearEnd } },
      _sum: { days: true },
    }),
  ]);

  const usedMap = new Map(usedByUser.map((u) => [u.userId, u._sum.days ?? 0]));

  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    peerDeleteRequestedAt: u.peerDeleteRequestedAt?.toISOString() ?? null,
    dateOfBirth: u.dateOfBirth?.toISOString() ?? null,
    usedDays: usedMap.get(u.id) ?? 0,
  }));
  const serializedResetRequests = resetRequests.map((r) => ({ id: r.id, createdAt: r.createdAt.toISOString(), user: r.user }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Staff</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Manage staff accounts, roles, and holiday allowances.
      </p>
      <UsersClient initialUsers={serializedUsers} initialResetRequests={serializedResetRequests} currentUserId={session.sub} />
    </div>
  );
}
