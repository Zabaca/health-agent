import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export type OAuthProvider = "google" | "apple";

/** Profile fields from the provider applied when linking/creating a user. */
export type OAuthProfile = {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
};

/**
 * Google avatar URLs end with a size suffix like `=s96-c` (96px square crop).
 * Rewrite it to a larger square crop so stored avatars aren't tiny. No-op for
 * URLs without the suffix (e.g. a hypothetical non-Google source).
 */
function normalizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(/=s\d+(-c)?$/, "=s256-c");
}

/**
 * Find-or-create the user row tied to an OAuth provider sub.
 *
 * Resolution order:
 *   1. Lookup by the provider's id column (`googleId` / `appleId`) — returning
 *      user. Backfill avatar / a verified email if the account lacks them.
 *   2. If the provider asserts a VERIFIED email, lookup by email and link the
 *      provider id to that account. Unverified emails are never used to link —
 *      that would be an account-takeover vector.
 *   3. Insert a new password-less user. The email is claimed only if verified,
 *      or unverified-but-unclaimed; otherwise the user is created WITHOUT an
 *      email and must supply one during onboarding.
 *
 * `profile` (name) is applied ONLY on fresh insert. Existing accounts keep
 * whatever name they already have — important for Apple, which returns the
 * name only on the very first authorization and never again.
 */
export async function upsertOAuthUser(
  provider: OAuthProvider,
  providerSub: string,
  email: string | null,
  emailVerified: boolean,
  profile?: OAuthProfile,
) {
  const idColumn = provider === "google" ? users.googleId : users.appleId;
  const idKey = provider === "google" ? "googleId" : "appleId";
  const avatarUrl = normalizeAvatarUrl(profile?.avatarUrl);

  // True only when the email is both present and provider-verified AND not
  // already owned by another account. `findFirst` lets us avoid unique clashes.
  const emailIsFree = email
    ? !(await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } }))
    : false;

  // 1. Returning user — found by provider sub.
  const byProvider = await db.query.users.findFirst({ where: eq(idColumn, providerSub) });
  if (byProvider) {
    const set: Partial<typeof users.$inferInsert> = {};
    if (avatarUrl && !byProvider.avatarUrl) set.avatarUrl = avatarUrl;
    // Backfill a verified email if the account never had one and it's free.
    if (!byProvider.email && email && emailVerified && emailIsFree) {
      set.email = email;
      set.emailVerified = true;
    }
    if (Object.keys(set).length) {
      await db.update(users).set(set).where(eq(users.id, byProvider.id));
      return { ...byProvider, ...set };
    }
    return byProvider;
  }

  // 2. Link to an existing account ONLY when the provider verifies the email.
  if (email && emailVerified && !emailIsFree) {
    const byEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (byEmail) {
      const set: Partial<typeof users.$inferInsert> = { [idKey]: providerSub, emailVerified: true };
      if (avatarUrl && !byEmail.avatarUrl) set.avatarUrl = avatarUrl;
      await db.update(users).set(set).where(eq(users.id, byEmail.id));
      return { ...byEmail, ...set };
    }
  }

  // 3. New user. Claim the email only if it's free (verified or not); a taken
  //    unverified email is dropped so onboarding collects/verifies a fresh one,
  //    avoiding both a unique clash and an unsafe link to someone else's account.
  //
  // TODO(JAM-319): this row is created with no DOB and no consent. The 18+ purge
  // only fires when the user voluntarily POSTs an under-18 DOB at the consent
  // gate — if they abandon the gate, a consent-less (possibly minor) account
  // lingers with a valid session. Proper fix is to defer row creation until
  // consent, rather than creating-then-purging. Tracked separately.
  const claimEmail = email && emailIsFree ? email : null;
  const claimVerified = !!claimEmail && emailVerified;

  const id = randomUUID();
  await db.insert(users).values({
    id,
    email: claimEmail,
    emailVerified: claimVerified,
    [idKey]: providerSub,
    ...(profile?.firstName ? { firstName: profile.firstName } : {}),
    ...(profile?.lastName ? { lastName: profile.lastName } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  });
  const created = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!created) throw new Error("Failed to create OAuth user");
  return created;
}
