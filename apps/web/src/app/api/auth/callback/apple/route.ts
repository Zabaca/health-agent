import { NextRequest } from "next/server";
import { handlers } from "@/auth";

/**
 * Apple Sign in with Apple always POSTs the authorization response
 * (code + state) as application/x-www-form-urlencoded when the email or name
 * scope is requested.
 *
 * Auth.js's callback handler detects `response_mode=form_post` in the Apple
 * provider config and reads callback params from the **request body**, not the
 * URL. This means:
 *
 *   - The Apple POST must be forwarded to Auth.js as a POST with the body
 *     intact (not as a GET redirect, which would leave body empty).
 *   - req.url in Next.js App Router reflects the internal server address when
 *     running behind a proxy (ngrok, Vercel, etc.). We rewrite the URL to
 *     NEXTAUTH_URL so Auth.js uses the correct public-facing callback URL when
 *     contacting Apple's token endpoint.
 *
 * GET is exported so Auth.js can handle OIDC discovery and other GET actions
 * at this path if needed.
 */
export async function POST(req: Request) {
  const body = await req.text();

  // Rewrite the URL to the public-facing base so Apple's token endpoint
  // receives the correct redirect_uri (must match the registered Return URL).
  const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const callbackUrl = new URL("/api/auth/callback/apple", base);

  const headers = new Headers(req.headers);
  headers.set("content-type", "application/x-www-form-urlencoded");

  return handlers.POST(
    new NextRequest(callbackUrl.toString(), { method: "POST", headers, body }),
  );
}

export const GET = handlers.GET;
