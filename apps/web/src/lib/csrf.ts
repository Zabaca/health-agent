import { NextResponse } from "next/server";

/**
 * Same-origin enforcement for state-changing, cookie-authed requests.
 *
 * Cookies ride along on cross-site requests by default (browsers send them
 * with `<form>`/`<img>`/`fetch({credentials:'include'})`), so any mutating
 * cookie-authed endpoint without an origin check is CSRF-vulnerable.
 *
 * Strategy:
 * - `Sec-Fetch-Site` (modern browsers, always sent on fetch/navigation):
 *   require `same-origin` or `none` (top-level nav / bookmark — can't be CSRF).
 * - `Origin` fallback: must match the request host.
 * - If neither is present and there's no Authorization header, reject —
 *   a real same-origin browser request will always send one of these.
 *
 * Bearer-token requests (mobile) bypass: cookies aren't involved, so CSRF
 * doesn't apply.
 */
export function requireSameOrigin(req: Request): NextResponse | null {
  if (req.headers.get("authorization")) return null;

  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) {
    if (fetchSite === "same-origin" || fetchSite === "none") return null;
    return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return null;
    } catch {
      // fall through to reject
    }
    return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  }

  return NextResponse.json({ error: "Missing origin" }, { status: 403 });
}
