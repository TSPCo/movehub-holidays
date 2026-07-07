const PALETTE = ["#00D4FF", "#6366F1", "#EC4899", "#22C55E", "#F59E0B", "#8B5CF6", "#F43F5E", "#14B8A6"];

/** Deterministically assigns a palette color to a user id, so the same staff member always gets the same color. */
export function colorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
