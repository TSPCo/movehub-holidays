import { db } from "@/lib/db";

export function getMonthRange(year: number, month: number) {
  const rangeStart = new Date(Date.UTC(year, month - 1, 1));
  const rangeEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  return { rangeStart, rangeEnd };
}

export async function fetchMonthRequests(year: number, month: number) {
  const { rangeStart, rangeEnd } = getMonthRange(year, month);

  return db.holidayRequest.findMany({
    where: {
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { lte: rangeEnd },
      endDate: { gte: rangeStart },
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { startDate: "asc" },
  });
}
