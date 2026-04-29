import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Clears all Auth.js session-token cookies and redirects. Bounced to from
 * `requirePageSession` when the cookie is invalid (no jti, revoked, expired,
 * missing Session row) — needed because layouts can't modify cookies, only
 * route handlers / server actions can.
 *
 * Without this round-trip, the user would loop: layout sees invalid session
 * → redirects to /login → middleware sees the cookie → bounces back to
 * /dashboard.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/login";
  // Only allow same-origin paths to prevent open-redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/login";

  const c = await cookies();
  for (const cookie of c.getAll()) {
    if (cookie.name.includes("authjs.session-token")) {
      c.delete(cookie.name);
    }
  }

  return NextResponse.redirect(new URL(safeNext, url));
}
