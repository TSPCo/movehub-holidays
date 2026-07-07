export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchMonthRequests } from "@/lib/calendarData";
import { CalendarView } from "@/components/CalendarView";

export default async function DashboardPage() {
  const session = await requireUser();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const [requests, user, yearRequests] = await Promise.all([
    fetchMonthRequests(year, month),
    db.user.findUnique({ where: { id: session.sub }, select: { allowanceDays: true } }),
    db.holidayRequest.findMany({
      where: {
        userId: session.sub,
        status: { in: ["APPROVED", "PENDING"] },
        startDate: { gte: new Date(Date.UTC(year, 0, 1)) },
        endDate: { lte: new Date(Date.UTC(year, 11, 31, 23, 59, 59)) },
      },
      select: { days: true, status: true },
    }),
  ]);

  const used = yearRequests.filter((r) => r.status === "APPROVED").reduce((sum, r) => sum + r.days, 0);
  const pending = yearRequests.filter((r) => r.status === "PENDING").reduce((sum, r) => sum + r.days, 0);
  const allowance = user?.allowanceDays ?? 0;
  const remaining = allowance - used;

  const serializedRequests = requests.map((r) => ({
    id: r.id,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    status: r.status as "PENDING" | "APPROVED",
    user: { id: r.user.id, name: r.user.name ?? r.user.email },
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Team Calendar</h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>See who&apos;s off across the team.</p>
        </div>
        <Link href="/requests" className="btn-primary px-4 py-2 text-sm">
          Request holiday
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-4 gap-3">
        <StatCard label={`${year} allowance`} value={allowance} />
        <StatCard label="Used" value={used} />
        <StatCard label="Pending" value={pending} />
        <StatCard label="Remaining" value={remaining} highlight />
      </div>

      <CalendarView initialYear={year} initialMonth={month} initialRequests={serializedRequests} />
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
      <p className="text-2xl font-bold" style={highlight ? { color: "var(--cyan)" } : undefined}>
        {value}
        <span className="text-sm font-normal ml-1" style={{ color: "var(--text-muted)" }}>days</span>
      </p>
    </div>
  );
}
