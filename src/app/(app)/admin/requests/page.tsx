export const dynamic = "force-dynamic";

import { requireApprover } from "@/lib/auth";
import { db } from "@/lib/db";
import { reviewerLabel } from "@/lib/roles";
import { AdminRequestsClient } from "./AdminRequestsClient";

export default async function AdminRequestsPage() {
  const session = await requireApprover();

  const requests = await db.holidayRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { name: true, email: true } },
    },
  });

  const serialized = requests.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    days: r.days,
    notes: r.notes,
    status: r.status,
    reviewNote: r.reviewNote,
    user: { id: r.user.id, name: r.user.name ?? r.user.email, email: r.user.email },
    reviewedByName: reviewerLabel(r.reviewedBy),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Approvals</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Review pending holiday requests from the team.
      </p>
      <AdminRequestsClient
        initialRequests={serialized}
        currentUserId={session.sub}
        canApproveOwn={session.liveRole === "ADMIN"}
      />
    </div>
  );
}
