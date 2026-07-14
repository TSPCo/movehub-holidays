"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { countWorkingDays } from "@/lib/holidays";
import { StatusBadge } from "@/components/StatusBadge";

type RequestItem = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewNote: string | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function todayInputValue() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function RequestsClient({ initialRequests }: { initialRequests: RequestItem[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState(initialRequests);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const minDate = todayInputValue();

  const previewDays = useMemo(() => {
    if (!startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return null;
    return countWorkingDays(start, end);
  }, [startDate, endDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setStartDate("");
      setEndDate("");
      setNotes("");
      const created = data.request;
      setRequests((prev) => [
        {
          id: created.id,
          startDate: created.startDate,
          endDate: created.endDate,
          days: created.days,
          notes: created.notes,
          status: created.status,
          reviewNote: created.reviewNote,
        },
        ...prev,
      ]);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (res.ok) {
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)));
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="card p-5 h-fit">
        <h2 className="text-sm font-semibold mb-4">New request</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="start-date" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Start date</label>
            <input
              id="start-date"
              type="date"
              required
              min={minDate}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="end-date" className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>End date</label>
            <input
              id="end-date"
              type="date"
              required
              min={startDate || minDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="px-3 py-2 text-sm w-full resize-none"
            />
          </div>

          {previewDays !== null && (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {previewDays === 0 ? "No working days in this range" : `${previewDays} working day${previewDays === 1 ? "" : "s"}`}
            </p>
          )}

          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

          <button type="submit" disabled={submitting} className="btn-primary mt-1 w-full py-2.5 text-sm">
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </div>

      <div className="col-span-2">
        {requests.length === 0 ? (
          <div className="card p-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            You haven&apos;t made any requests yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {requests.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(r.startDate)} → {formatDate(r.endDate)}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {r.days} working day{r.days === 1 ? "" : "s"}
                    </p>
                    {r.notes && <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>{r.notes}</p>}
                    {r.status === "REJECTED" && r.reviewNote && (
                      <p className="text-xs mt-1.5" style={{ color: "var(--danger)" }}>Reason: {r.reviewNote}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={r.status} />
                    {(r.status === "PENDING" || r.status === "APPROVED") && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="text-xs font-medium"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
