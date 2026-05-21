import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { verifyGoogleIdToken } from "@/lib/oauth-verify";
import { linkProviderSub } from "@/lib/account-connections";

/**
 * Links a Google identity to the *current* signed-in user (mobile, native flow).
 * Attaches the Google `sub` to the authenticated caller, rejecting it if that
 * sub is already on another account.
 */
export async function POST(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const body = (await req.json().catch(() => null)) as { idToken?: unknown } | null;
  const idToken = body?.idToken;
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  let verified;
  try {
    verified = await verifyGoogleIdToken(idToken);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid Google ID token", detail: (err as Error).message },
      { status: 401 },
    );
  }

  const res = await linkProviderSub(result.userId, "google", verified.sub);
  if (!res.ok) {
    return NextResponse.json(
      { error: "This Google account is already linked to a different account." },
      { status: 409 },
    );
  }
  return NextResponse.json({ success: true });
}
