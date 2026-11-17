import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "mh_session";
const PUBLIC_PATHS = ["/login", "/invite", "/forgot-password", "/reset-password"];

function getSecretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  let role: string | undefined;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecretKey());
      role = payload.role as string;
    } catch {
      role = undefined;
    }
  }

  const isApi = pathname.startsWith("/api");

  if (!role) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Approvals are also open to Team Leaders. Their page and API check the
  // user's current role in the database themselves (so a promotion works
  // without signing out and back in), so the proxy just lets them through.
  const isApprovalsRoute =
    pathname === "/admin/requests" || pathname.startsWith("/admin/requests/") ||
    pathname === "/api/admin/requests" || pathname.startsWith("/api/admin/requests/");
  const isAdminRoute = !isApprovalsRoute && (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"));
  if (isAdminRoute && role !== "ADMIN") {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api/auth|api/invite|api/availability|api/webhooks|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico|webmanifest|txt|xml)$).*)"],
};
