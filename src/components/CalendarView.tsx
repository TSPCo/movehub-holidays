"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { colorForUser } from "@/lib/colors";

export type CalendarRequest = {
  id: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED";
  user: { id: string; name: string };
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildGrid(year: number, month: number) {
  // month is 1-12. Always builds a 6-week (42 day) grid, Monday-first, in UTC to avoid timezone drift.
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = (first.getUTCDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(Date.UTC(year, month - 1, 1 - firstWeekday));

  return Array.from({ length: 42 }, (_, i) =>
    new Date(Date.UTC(gridStart.getUTCFullYear(), gridStart.getUTCMonth(), gridStart.getUTCDate() + i))
  );
}

function dayKey(d: Date) {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function monthKeyOf(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function CalendarView({ initialYear, initialMonth, initialRequests }: { initialYear: number; initialMonth: number; initialRequests: CalendarRequest[] }) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth); // 1-12

  // Keyed by the month it was fetched for, so `loading` can be derived by comparing
  // keys during render instead of toggled with a setState call inside the effect.
  const [data, setData] = useState({ key: monthKeyOf(initialYear, initialMonth), requests: initialRequests });

  const monthKey = monthKeyOf(year, month);
  const loading = data.key !== monthKey;
  const requests = data.requests;

  useEffect(() => {
    if (data.key === monthKey) return;
    let cancelled = false;
    fetch(`/api/calendar?month=${monthKey}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setData({ key: monthKey, requests: json.requests ?? [] });
      });
    return () => {
      cancelled = true;
    };
  }, [monthKey, data.key]);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarRequest[]>();
    for (const req of requests) {
      const s = new Date(req.startDate);
      const e = new Date(req.endDate);
      const cursor = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
      const endUtc = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
      while (Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate()) <= endUtc) {
        const key = dayKey(cursor);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(req);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }
    return map;
  }, [requests]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  function goToMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }
    setMonth(newMonth);
    setYear(newYear);
  }

  const peopleThisMonth = useMemo(() => {
    const map = new Map<string, string>();
    for (const req of requests) map.set(req.user.id, req.user.name);
    return Array.from(map.entries());
  }, [requests]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToMonth(-1)}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setMonth(today.getMonth() + 1);
              setYear(today.getFullYear());
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
          >
            Today
          </button>
          <button
            onClick={() => goToMonth(1)}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
        <div className="grid grid-cols-7" style={{ borderBottom: "1px solid var(--border)" }}>
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="px-2 py-2 text-center text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day, i) => {
            const inMonth = day.getUTCMonth() === month - 1;
            const key = dayKey(day);
            const isWeekend = day.getUTCDay() === 0 || day.getUTCDay() === 6;
            const dayRequests = byDay.get(key) ?? [];
            const isToday = key === todayKey;

            return (
              <div
                key={i}
                className="min-h-[92px] p-1.5"
                style={{
                  borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border)" : undefined,
                  borderTop: i >= 7 ? "1px solid var(--border)" : undefined,
                  background: isWeekend ? "rgba(255,255,255,0.015)" : undefined,
                  opacity: inMonth ? 1 : 0.35,
                }}
              >
                <div className="flex items-center justify-center mb-1">
                  <span
                    className="text-xs h-5 w-5 flex items-center justify-center rounded-full"
                    style={isToday ? { background: "var(--gradient)", color: "#fff", fontWeight: 600 } : { color: "var(--text-secondary)" }}
                  >
                    {day.getUTCDate()}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {dayRequests.slice(0, 3).map((req) => (
                    <div
                      key={req.id}
                      title={`${req.user.name} — ${req.status === "PENDING" ? "requested" : "off"}`}
                      className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight"
                      style={{
                        background: `${colorForUser(req.user.id)}22`,
                        color: colorForUser(req.user.id),
                        border: req.status === "PENDING" ? `1px dashed ${colorForUser(req.user.id)}88` : "1px solid transparent",
                      }}
                    >
                      {initials(req.user.name)} {req.user.name.split(" ")[0]}
                    </div>
                  ))}
                  {dayRequests.length > 3 && (
                    <div className="text-[10px] px-1" style={{ color: "var(--text-muted)" }}>
                      +{dayRequests.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ border: "1px dashed var(--text-muted)" }} />
          Pending request
        </span>
        {peopleThisMonth.map(([id, name]) => (
          <span key={id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colorForUser(id) }} />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
