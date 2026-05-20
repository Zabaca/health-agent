import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export type OAuthProvider = "google" | "apple";

/** Display name from the provider, used only when creating a brand-new user. */
export type OAuthProfile = { firstName?: string | null; lastName?: string | null };

/**
 * Find-or-create the user row tied to an OAuth provider sub.
 *
 * Resolution order:
 *   1. Lookup by the provider's id column (`googleId` / `appleId`).
 *   2. Lookup by email — if found, link the provider id to that account.
 *   3. Insert a brand-new password-less user with the provider id populated.
 *
 * `profile` (name) is applied ONLY on fresh insert. Existing accounts keep
 * whatever name they already have — important for Apple, which returns the
 * name only on the very first authorization and never again.
 */
export async function upsertOAuthUser(
  provider: OAuthProvider,
  providerSub: string,
  email: string,
  profile?: OAuthProfile,
) {
  const idColumn = provider === "google" ? users.googleId : users.appleId;
  const idKey = provider === "google" ? "googleId" : "appleId";

  const byProvider = await db.query.users.findFirst({ where: eq(idColumn, providerSub) });
  if (byProvider) return byProvider;

  const byEmail = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (byEmail) {
    await db.update(users).set({ [idKey]: providerSub }).where(eq(users.id, byEmail.id));
    return { ...byEmail, [idKey]: providerSub };
  }

  const id = randomUUID();
  await db.insert(users).values({
    id,
    email,
    [idKey]: providerSub,
    ...(profile?.firstName ? { firstName: profile.firstName } : {}),
    ...(profile?.lastName ? { lastName: profile.lastName } : {}),
  });
  const created = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!created) throw new Error("Failed to create OAuth user");
  return created;
}
