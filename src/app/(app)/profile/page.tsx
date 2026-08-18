export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await requireUser();

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      postcode: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
    },
  });

  if (!user) return null;

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">My details</h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
        Keep your contact details up to date — e.g. if you move house or change your number.
      </p>
      <ProfileClient
        user={{
          ...user,
          dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
