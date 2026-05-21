import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth, signIn } from "@/auth";
import {
  createLinkIntent,
  safeReturnPath,
  LINK_NONCE_COOKIE,
  LINK_RETURN_COOKIE,
} from "@/lib/account-connections";

/**
 * Starts the web "link a provider" flow for the signed-in user. Creates a
 * one-shot link intent (consumed in the sign-in callback) and kicks off the
 * normal provider OAuth. Because the callback attaches the returned sub to this
 * same user, no account switch happens.
 *
 * The nonce cookie must reach the OAuth callback:
 *   - Apple posts the callback cross-site (form_post) → sameSite=none + secure
 *     (https only, which Apple already requires).
 *   - Google returns via a top-level GET redirect → sameSite=lax (works on
 *     http://localhost too).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const session = await auth();
  const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", base));
  }

  const { provider } = await params;
  if (provider !== "google" && provider !== "apple") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const isApple = provider === "apple";
  const isHttps = base.startsWith("https");
  const returnTo = safeReturnPath(new URL(req.url).searchParams.get("returnTo"));

  // Apple's cross-site form_post callback needs a sameSite=none;secure cookie,
  // which browsers drop on http. Apple also rejects localhost return URLs, so
  // there's no working Apple flow on http — fail clearly instead of "expired".
  if (isApple && !isHttps) {
    return NextResponse.redirect(new URL(`${returnTo}?linkError=apple_https`, base));
  }

  const nonce = await createLinkIntent(session.user.id, provider);
  // signIn(redirect:false) sets the OAuth state/PKCE/nonce cookies via the
  // next/headers cookie store. Set our cookies on that SAME store (not on a
  // separate NextResponse) so all of them reliably ship on the redirect.
  const authorizeUrl = await signIn(provider, { redirect: false, redirectTo: returnTo });

  const jar = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: isApple || isHttps,
    sameSite: (isApple ? "none" : "lax") as "none" | "lax",
    maxAge: 600,
    path: "/",
  };
  jar.set(LINK_NONCE_COOKIE, nonce, cookieOpts);
  jar.set(LINK_RETURN_COOKIE, returnTo, cookieOpts);
  return NextResponse.redirect(authorizeUrl);
}
