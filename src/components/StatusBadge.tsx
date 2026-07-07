const STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: "rgba(245,158,11,0.15)", color: "var(--warning)", label: "Pending" },
  APPROVED: { bg: "rgba(34,197,94,0.15)", color: "var(--success)", label: "Approved" },
  REJECTED: { bg: "rgba(244,63,94,0.15)", color: "var(--danger)", label: "Rejected" },
  CANCELLED: { bg: "rgba(148,163,184,0.15)", color: "var(--text-muted)", label: "Cancelled" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.PENDING;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: style.bg, color: style.color }}
    >
      {style.label}
    </span>
  );
}
