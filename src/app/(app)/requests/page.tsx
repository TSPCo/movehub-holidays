export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { RequestsClient } from "./RequestsClient";

export default async function RequestsPage() {
  const session = await requireUser();

  const requests = await db.holidayRequest.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  const serialized = requests.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    days: r.days,
    notes: r.notes,
    status: r.status,
    reviewNote: r.reviewNote,
  }));

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">My Requests</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Request time off and track the status of your requests.
      </p>
      <RequestsClient initialRequests={serialized} />
    </div>
  );
}
