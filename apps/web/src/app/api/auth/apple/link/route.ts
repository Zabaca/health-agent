import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { verifyAppleIdentityToken } from "@/lib/oauth-verify";
import { linkProviderSub } from "@/lib/account-connections";

/**
 * Links an Apple identity to the *current* signed-in user (mobile, native flow).
 * Unlike sign-in, this never switches accounts — it attaches the Apple `sub` to
 * the authenticated caller, rejecting it if that sub is already on another user.
 */
export async function POST(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const body = (await req.json().catch(() => null)) as { identityToken?: unknown } | null;
  const identityToken = body?.identityToken;
  if (typeof identityToken !== "string" || !identityToken) {
    return NextResponse.json({ error: "identityToken is required" }, { status: 400 });
  }

  let verified;
  try {
    verified = await verifyAppleIdentityToken(identityToken);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid Apple identity token", detail: (err as Error).message },
      { status: 401 },
    );
  }

  const res = await linkProviderSub(result.userId, "apple", verified.sub);
  if (!res.ok) {
    return NextResponse.json(
      { error: "This Apple account is already linked to a different account." },
      { status: 409 },
    );
  }
  return NextResponse.json({ success: true });
}
