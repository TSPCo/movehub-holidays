// Shared by server and client components — keep this free of server-only imports.

export type Role = "ADMIN" | "TEAM_LEADER" | "STAFF";

export const ROLES: Role[] = ["STAFF", "TEAM_LEADER", "ADMIN"];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  TEAM_LEADER: "Team Leader",
  STAFF: "Staff",
};

export function parseRole(value: unknown): Role | null {
  return value === "ADMIN" || value === "TEAM_LEADER" || value === "STAFF" ? value : null;
}

/** Admins and Team Leaders can approve/reject holiday requests. */
export function canApprove(role: Role | null | undefined) {
  return role === "ADMIN" || role === "TEAM_LEADER";
}

/** How an approver is shown on a request's status tag, e.g. "Approved · hello". */
export function reviewerLabel(reviewer: { name: string | null; email: string } | null | undefined) {
  if (!reviewer) return null;
  return reviewer.name?.trim() || reviewer.email.split("@")[0];
}
