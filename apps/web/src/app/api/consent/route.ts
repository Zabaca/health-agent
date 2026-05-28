import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { consentSchema, CONSENT_VERSION, isAdult } from "@health-agent/types";
import { resolveUserSession } from "@/lib/session-resolver";
import { buildUserSessionPayload } from "@/auth";
import { signMobileSessionToken } from "@/lib/oauth-verify";
import { hardDeleteUser } from "@/lib/account-deletion";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decrypt, encryptPii } from "@/lib/crypto";
import { toIsoDate } from "@/lib/dates";

/**
 * Records onboarding consent for the signed-in user (web cookie or mobile
 * Bearer). Enforces the 18+ age gate server-side: PDA-invited accounts are
 * exempt; OAuth users supply their DOB here (none on file at sign-in) and an
 * under-18 row — which has no PHI yet — is hard-deleted on the spot.
 */
export async function POST(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const parsed = consentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Both Terms and Privacy must be accepted." }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, result.userId) });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storedDob = user.dateOfBirth ? toIsoDate(decrypt(user.dateOfBirth)) : null;
  const effectiveDob = storedDob ?? parsed.data.dateOfBirth ?? null;

  // PDA-invited accounts are exempt from the age gate (the inviting adult's
  // invitation is proof of consent). Everyone else must clear 18+.
  if (!result.isPda) {
    if (!effectiveDob) {
      return NextResponse.json({ error: "Date of birth is required." }, { status: 400 });
    }
    if (!isAdult(effectiveDob)) {
      await hardDeleteUser(result.userId);
      return NextResponse.json({ error: "underage" }, { status: 403 });
    }
  }

  await db
    .update(users)
    .set({
      consentedAt: new Date().toISOString(),
      consentVersion: CONSENT_VERSION,
      // Persist a freshly-supplied DOB only when none was on file (OAuth path).
      ...(parsed.data.dateOfBirth && !storedDob
        ? encryptPii({ dateOfBirth: toIsoDate(parsed.data.dateOfBirth) })
        : {}),
    })
    .where(eq(users.id, result.userId));

  // Mobile carries a self-contained JWT — re-mint it (reusing the existing jti so
  // the session row stays valid) so the client's token reflects the new
  // consentedAt. Web refreshes its NextAuth JWT client-side via update().
  if (result.source === "mobile") {
    const updated = await db.query.users.findFirst({ where: eq(users.id, result.userId) });
    if (!updated) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await buildUserSessionPayload(updated);
    const sessionToken = await signMobileSessionToken({
      sub: payload.id,
      jti: result.currentJti,
      ...payload,
    });
    return NextResponse.json({ user: payload, sessionToken });
  }

  return NextResponse.json({ success: true });
}
