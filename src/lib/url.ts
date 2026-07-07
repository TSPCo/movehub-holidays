import type { NextRequest } from "next/server";

/**
 * The app's canonical public URL, for links that must work outside the request
 * that generated them (invites, password resets). `request.nextUrl.origin` isn't
 * reliable behind a reverse proxy — it reflects how the proxy sees the request
 * internally (e.g. `localhost:8080` on Railway), not the public-facing domain.
 * Falls back to the request's own origin for local dev, where APP_URL usually isn't set.
 */
export function getAppUrl(request: NextRequest) {
  return process.env.APP_URL ?? request.nextUrl.origin;
}
