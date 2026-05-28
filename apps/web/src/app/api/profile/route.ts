import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { decrypt, encryptPii, extractLast4Ssn } from "@/lib/crypto";
import { toIsoDate } from "@/lib/dates";
import { isUniqueViolation } from "@/lib/account-connections";
import { z } from "zod";

export const GET = contractRoute(contract.profile.get, async ({ req }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const user = await db.query.users.findFirst({
    where: eq(users.id, result.userId),
  });

  return NextResponse.json({
    firstName:   user?.firstName   ?? "",
    middleName:  user?.middleName  ?? "",
    lastName:    user?.lastName    ?? "",
    dateOfBirth: user?.dateOfBirth ? toIsoDate(decrypt(user.dateOfBirth)) : "",
    address:     user?.address     ?? "",
    phoneNumber: user?.phoneNumber ?? "",
    ssn:         user?.ssn         ? decrypt(user.ssn) : "",
    avatarUrl:   user?.avatarUrl   ?? null,
    email:       user?.email       ?? null,
  });
});

const EMAIL_TAKEN_MESSAGE =
  "An account with this email already exists. Sign in with your password to link it.";

/**
 * Resolves a self-asserted onboarding email into a column update. This is a
 * COLLECT-WHEN-MISSING path only: if the account already has an email, the
 * submitted value is ignored (this endpoint must never change or unverify an
 * existing email — the client `needsEmail` flag is advisory and bypassable).
 *
 * When the account has no email and one is supplied, it is stored as unverified
 * and uniqueness is enforced across all accounts — a collision means the email
 * belongs to someone else and we won't silently link it. Returns the resulting
 * email so callers can gate `profileComplete` on it.
 */
async function resolveEmailUpdate(
  email: string | undefined,
  userId: string,
): Promise<
  | { conflict: true }
  | { conflict: false; set: Partial<typeof users.$inferInsert>; finalEmail: string | null }
> {
  const current = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true },
  });
  // Already has an email — never overwrite it through this path.
  if (current?.email) return { conflict: false, set: {}, finalEmail: current.email };
  if (!email) return { conflict: false, set: {}, finalEmail: null };

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  if (existing && existing.id !== userId) return { conflict: true };
  return { conflict: false, set: { email, emailVerified: false }, finalEmail: email };
}

// PATCH — partial update (name, phone, address, avatar, onboarding email, healthKitConnected)
const partialProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  avatarUrl: z.string().nullable().optional(),
  email: z.string().email().optional().or(z.literal("")),
  healthKitConnected: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const body = partialProfileSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { avatarUrl, email, healthKitConnected, ...rest } = body.data;

  const emailUpdate = await resolveEmailUpdate(email || undefined, result.userId);
  if (emailUpdate.conflict) {
    return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 409 });
  }

  try {
    await db.update(users).set({
      ...rest,
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl || null } : {}),
      ...(healthKitConnected !== undefined ? { healthKitConnected } : {}),
      ...emailUpdate.set,
    }).where(eq(users.id, result.userId));
  } catch (err) {
    // A concurrent request could claim this email between resolveEmailUpdate's
    // check and this write; the unique index catches it. Surface as 409.
    if (emailUpdate.set.email && isUniqueViolation(err)) {
      return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ success: true });
}

export const PUT = contractRoute(contract.profile.update, async ({ req, body }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { avatarUrl, ssn, email, ...rest } = body;

  const emailUpdate = await resolveEmailUpdate(email || undefined, result.userId);
  if (emailUpdate.conflict) {
    return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 409 });
  }

  // Never mark the profile complete while the account has no email on file —
  // the onboarding-complete gate relies on this invariant.
  const finalEmail = emailUpdate.finalEmail;

  const normalized = {
    ...rest,
    ssn: ssn ? extractLast4Ssn(ssn) : null,
    ...(rest.dateOfBirth ? { dateOfBirth: toIsoDate(rest.dateOfBirth) } : {}),
  };
  try {
    await db
      .update(users)
      .set({
        ...encryptPii(normalized),
        profileComplete: !!finalEmail,
        avatarUrl: avatarUrl || null,
        ...emailUpdate.set,
      })
      .where(eq(users.id, result.userId));
  } catch (err) {
    if (emailUpdate.set.email && isUniqueViolation(err)) {
      return NextResponse.json({ error: EMAIL_TAKEN_MESSAGE }, { status: 409 });
    }
    throw err;
  }

  revalidatePath('/profile');
  revalidatePath('/dashboard');

  return NextResponse.json({ success: true });
});
