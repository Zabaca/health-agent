import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export type OAuthProvider = "google" | "apple";

/**
 * Find-or-create the user row tied to an OAuth provider sub.
 *
 * Resolution order:
 *   1. Lookup by the provider's id column (`googleId` / `appleId`).
 *   2. Lookup by email — if found, link the provider id to that account.
 *   3. Insert a brand-new password-less user with the provider id populated.
 */
export async function upsertOAuthUser(
  provider: OAuthProvider,
  providerSub: string,
  email: string,
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
  });
  const created = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!created) throw new Error("Failed to create OAuth user");
  return created;
}
