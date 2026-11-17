const STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.15)", color: "var(--warning)", label: "Pending" },
  APPROVED: { bg: "rgba(34,197,94,0.15)", color: "var(--success)", label: "Approved" },
  REJECTED: { bg: "rgba(244,63,94,0.15)", color: "var(--danger)", label: "Rejected" },
  CANCELLED: { bg: "rgba(148,163,184,0.15)", color: "var(--text-muted)", label: "Cancelled" },
};

/** `reviewedBy` is shown on Approved/Rejected tags, e.g. "Approved · hello". */
export function StatusBadge({ status, reviewedBy }: { status: string; reviewedBy?: string | null }) {
  const style = STYLES[status] ?? STYLES.PENDING;
  const showReviewer = Boolean(reviewedBy) && (status === "APPROVED" || status === "REJECTED");
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
      title={showReviewer ? `${style.label} by ${reviewedBy}` : undefined}
    >
      {style.label}
      {showReviewer && <span className="ml-1 opacity-80">· {reviewedBy}</span>}
    </span>
  );
}
