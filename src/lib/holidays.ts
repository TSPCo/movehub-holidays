// UK (England & Wales) bank holidays — update this list annually.
// Source: gov.uk bank holiday calendar.
export const UK_BANK_HOLIDAYS = new Set([
  "2026-01-01", // New Year's Day
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-04", // Early May bank holiday
  "2026-05-25", // Spring bank holiday
  "2026-08-31", // Summer bank holiday
  "2026-12-25", // Christmas Day
  "2026-12-28", // Boxing Day (substitute, 26th falls on a Saturday)
  "2027-01-01", // New Year's Day
]);

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isWeekend(date: Date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

/** Counts working days (Mon–Fri, excluding UK bank holidays) between two dates, inclusive. */
export function countWorkingDays(start: Date, end: Date): number {
  const startUtc = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  if (endUtc < startUtc) return 0;

  let count = 0;
  const cursor = new Date(startUtc);
  while (cursor <= endUtc) {
    if (!isWeekend(cursor) && !UK_BANK_HOLIDAYS.has(toDateKey(cursor))) {
      count++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
}
