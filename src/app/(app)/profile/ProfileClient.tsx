"use client";

import { useState } from "react";

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};

const DETAIL_FIELDS: { key: keyof ProfileUser; label: string; type?: string }[] = [
  { key: "phone", label: "Phone" },
  { key: "dateOfBirth", label: "Date of birth", type: "date" },
  { key: "addressLine1", label: "Address line 1" },
  { key: "addressLine2", label: "Address line 2" },
  { key: "city", label: "City" },
  { key: "postcode", label: "Postcode" },
  { key: "emergencyContactName", label: "Emergency contact name" },
  { key: "emergencyContactPhone", label: "Emergency contact phone" },
];

// Deliberately not a native <input type="date"> — Safari (and some other
// browsers) visually pre-fill an EMPTY date input with today's date as a
// rendering hint, which looks indistinguishable from an actually-saved
// value even though nothing was entered. A plain DD/MM/YYYY text field
// can't lie about being empty.
function toDateDisplayValue(iso: string | null): string {
  if (!iso) return "";
  const [yyyy, mm, dd] = iso.slice(0, 10).split("-");
  return `${dd}/${mm}/${yyyy}`;
}

/** Returns an ISO date (YYYY-MM-DD) for a valid DD/MM/YYYY, "" to clear, or undefined if unparseable. */
function parseDobInput(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(dd) || d.getUTCMonth() + 1 !== Number(mm)) {
    return undefined;
  }
  return iso;
}

export function ProfileClient({ user }: { user: ProfileUser }) {
  const [values, setValues] = useState(user);
  const [error, setError] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);

  async function save(field: keyof ProfileUser, value: string) {
    setError(null);
    const current = (values[field] as string | null) ?? "";
    if (value === current) return;

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Something went wrong");
      return;
    }
    setValues((prev) => ({ ...prev, ...body.user }));
    setSavedField(field);
    setTimeout(() => setSavedField((f) => (f === field ? null : f)), 1500);
  }

  async function saveDob(rawValue: string, inputEl: HTMLInputElement) {
    const parsed = parseDobInput(rawValue);
    if (parsed === undefined) {
      inputEl.value = toDateDisplayValue(values.dateOfBirth);
      alert("Enter the date as DD/MM/YYYY, or leave it blank.");
      return;
    }
    if (parsed === (values.dateOfBirth?.slice(0, 10) ?? "")) return;

    setError(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateOfBirth: parsed }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "Something went wrong");
      return;
    }
    setValues((prev) => ({ ...prev, ...body.user }));
    setSavedField("dateOfBirth");
    setTimeout(() => setSavedField((f) => (f === "dateOfBirth" ? null : f)), 1500);
  }

  return (
    <div className="card p-5 max-w-2xl">
      <div className="mb-4">
        <p className="text-sm font-medium">{values.name ?? values.email}</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{values.email}</p>
      </div>

      {error && <p className="text-sm mb-3" style={{ color: "var(--danger)" }}>{error}</p>}

      <div className="grid grid-cols-2 gap-4">
        {DETAIL_FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--text-muted)" }}>
              {field.label}
              {savedField === field.key && <span className="ml-2" style={{ color: "var(--success)" }}>Saved</span>}
            </label>
            {field.type === "date" ? (
              <input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                defaultValue={toDateDisplayValue(values.dateOfBirth)}
                onBlur={(e) => saveDob(e.target.value, e.target)}
                className="px-3 py-2 text-sm w-full"
              />
            ) : (
              <input
                type="text"
                defaultValue={(values[field.key] as string | null) ?? ""}
                onBlur={(e) => save(field.key, e.target.value)}
                className="px-3 py-2 text-sm w-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
