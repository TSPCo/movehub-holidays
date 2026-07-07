"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

type RequestItem = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewNote: string | null;
  user: { id: string; name: string; email: string };
  reviewedByName: string | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function AdminRequestsClient({ initialRequests }: { initialRequests: RequestItem[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const pending = useMemo(() => requests.filter((r) => r.status === "PENDING"), [requests]);
  const history = useMemo(() => requests.filter((r) => r.status !== "PENDING"), [requests]);

  async function review(id: string, action: "approve" | "reject", reviewNote?: string) {
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewNote }),
    });
    if (res.ok) {
      const data = await res.json();
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: data.request.status, reviewNote: data.request.reviewNote } : r)));
      setRejectingId(null);
      setRejectNote("");
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="text-sm font-semibold mb-3">
          Pending
          {pending.length > 0 && (
            <span className="ml-2 rounded-full px-2 py-0.5 text-xs" style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}>
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length === 0 ? (
          <div className="card p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            No pending requests.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{r.user.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.days} day{r.days === 1 ? "" : "s"}
                    </p>
                    {r.notes && <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => review(r.id, "approve")}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(34,197,94,0.15)", color: "var(--success)" }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === r.id ? null : r.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "rgba(244,63,94,0.15)", color: "var(--danger)" }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
                {rejectingId === r.id && (
                  <div className="mt-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                    <input
                      autoFocus
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="Reason for rejecting (optional)"
                      className="flex-1 px-3 py-1.5 text-xs"
                    />
                    <button
                      onClick={() => review(r.id, "reject", rejectNote)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium"
                      style={{ background: "var(--danger)", color: "#fff" }}
                    >
                      Confirm reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No reviewed requests yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((r) => (
              <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{r.user.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    {formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.days} day{r.days === 1 ? "" : "s"}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
