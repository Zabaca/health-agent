import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { resolveUserSession } from "@/lib/session-resolver";
import { buildUserSessionPayload } from "@/auth";
import { signMobileSessionToken } from "@/lib/oauth-verify";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const schema = z.object({
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
  address: z.string().trim().min(1, "Mailing address is required"),
});

/**
 * Completes PDA onboarding for the mobile client: collects the agent's contact
 * phone + mailing address (so patients and staff can reach them) and flips
 * `onboarded`. Mirrors the web PdaOnboardingModal flow (PATCH /api/profile +
 * PATCH /api/onboarding/complete) but in one atomic call, then re-mints the
 * self-contained JWT — reusing the existing jti so the session row stays valid —
 * so the client's `user.onboarded` reflects the change and RootNavigator
 * advances out of the onboarding gate. Same re-mint pattern as /api/consent.
 */
export async function POST(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Phone number and address are required.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, result.userId) });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // An email is mandatory before onboarding can finish — the web onboarding gate
  // relies on this invariant (onboarded ⇒ has email). Invited PDAs always have
  // one; this only guards the OAuth-without-email edge.
  if (!user.email) {
    return NextResponse.json(
      { error: "An email address is required to complete onboarding." },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({
      phoneNumber: parsed.data.phoneNumber,
      address: parsed.data.address,
      onboarded: true,
    })
    .where(eq(users.id, result.userId));

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
