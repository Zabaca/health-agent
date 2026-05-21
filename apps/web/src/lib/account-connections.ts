import { db } from "@/lib/db";
import { users, linkIntents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export type OAuthProvider = "google" | "apple";

export type Connections = {
  email: string | null;
  hasPassword: boolean;
  apple: boolean;
  google: boolean;
};

type MethodFields = Pick<typeof users.$inferSelect, "password" | "email" | "appleId" | "googleId">;

export function getConnections(user: MethodFields): Connections {
  return {
    email: user.email,
    // Credentials sign-in needs BOTH an email and a password.
    hasPassword: !!user.password && !!user.email,
    apple: !!user.appleId,
    google: !!user.googleId,
  };
}

/** Count of usable sign-in methods — credentials counts only with email AND password. */
export function signInMethodCount(user: MethodFields): number {
  return (
    (user.password && user.email ? 1 : 0) +
    (user.appleId ? 1 : 0) +
    (user.googleId ? 1 : 0)
  );
}

export type LinkResult = { ok: true } | { ok: false; reason: "conflict" };

/** Attach a provider sub to a user. Fails if that sub is already on another account. */
export async function linkProviderSub(
  userId: string,
  provider: OAuthProvider,
  sub: string,
): Promise<LinkResult> {
  const idColumn = provider === "google" ? users.googleId : users.appleId;
  const idKey = provider === "google" ? "googleId" : "appleId";
  const existing = await db.query.users.findFirst({
    where: eq(idColumn, sub),
    columns: { id: true },
  });
  if (existing && existing.id !== userId) return { ok: false, reason: "conflict" };
  await db.update(users).set({ [idKey]: sub }).where(eq(users.id, userId));
  return { ok: true };
}

export type UnlinkResult = { ok: true } | { ok: false; reason: "not_linked" | "last_method" };

/** Remove a provider from a user, unless it's their only remaining sign-in method. */
export async function unlinkProvider(
  userId: string,
  provider: OAuthProvider,
): Promise<UnlinkResult> {
  const idKey = provider === "google" ? "googleId" : "appleId";
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { password: true, email: true, appleId: true, googleId: true },
  });
  if (!user || !user[idKey]) return { ok: false, reason: "not_linked" };
  // Block if removing this would leave the user with no way to sign in.
  if (signInMethodCount({ ...user, [idKey]: null }) < 1) {
    return { ok: false, reason: "last_method" };
  }
  await db.update(users).set({ [idKey]: null }).where(eq(users.id, userId));
  return { ok: true };
}

// ── One-shot link intents (web OAuth-while-authenticated) ──────────────────────

const LINK_INTENT_TTL_MS = 10 * 60 * 1000;
export const LINK_NONCE_COOKIE = "link_nonce";
export const LINK_RETURN_COOKIE = "link_return";

/** Only same-site relative return paths are allowed for post-link redirects. */
export function safeReturnPath(raw: string | undefined | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/profile";
}

export async function createLinkIntent(userId: string, provider: OAuthProvider): Promise<string> {
  const nonce = randomUUID();
  await db.insert(linkIntents).values({
    nonce,
    userId,
    provider,
    expiresAt: new Date(Date.now() + LINK_INTENT_TTL_MS),
  });
  return nonce;
}

/**
 * Consume (delete) a link intent. One-shot: the row is deleted unconditionally,
 * so a replayed nonce resolves to null on the second use. Returns the intent's
 * userId only when the nonce is valid, unexpired, and matches the provider.
 */
export async function consumeLinkIntent(
  nonce: string,
  provider: OAuthProvider,
): Promise<{ userId: string } | null> {
  const row = await db.query.linkIntents.findFirst({ where: eq(linkIntents.nonce, nonce) });
  await db.delete(linkIntents).where(eq(linkIntents.nonce, nonce));
  if (!row || row.provider !== provider) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;
  return { userId: row.userId };
}
