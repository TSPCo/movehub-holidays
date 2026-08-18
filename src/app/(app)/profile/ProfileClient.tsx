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

function toDateInputValue(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
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
            <input
              type={field.type ?? "text"}
              defaultValue={
                field.type === "date"
                  ? toDateInputValue(values[field.key] as string | null)
                  : (values[field.key] as string | null) ?? ""
              }
              onBlur={(e) => save(field.key, e.target.value)}
              className="px-3 py-2 text-sm w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
