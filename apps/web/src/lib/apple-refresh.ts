import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { exchangeAppleAuthCode } from "@/lib/apple-secret";
import { encrypt } from "@/lib/crypto";

/**
 * Apple refresh-token capture, stored (encrypted) so account deletion can call
 * Apple's /auth/revoke (App Store 5.1.1(v)).
 *
 * Kept in its own module (not oauth-link.ts) because it imports `crypto`
 * (Node-only) — oauth-link is top-imported by auth.config, which the edge
 * middleware bundles, so pulling Node `crypto` into that graph would break the
 * edge build. Import this from Node-runtime routes, or lazily from callbacks.
 */

/**
 * NATIVE flow: exchange an Apple authorization code (issued to the bundle ID)
 * for a refresh token and store it. Best-effort; never blocks sign-in.
 */
export async function captureAppleRefreshTokenFromCode(
  userId: string,
  authorizationCode: string | undefined,
  clientId: string | undefined,
): Promise<void> {
  if (!authorizationCode) return;
  const refresh = await exchangeAppleAuthCode(authorizationCode, clientId);
  if (refresh) {
    await db.update(users).set({ appleRefreshToken: encrypt(refresh) }).where(eq(users.id, userId));
  }
}

/**
 * WEB flow: store an already-obtained refresh token (Auth.js exchanged the code
 * and exposes `account.refresh_token`). Encrypted at rest.
 */
export async function storeAppleRefreshToken(
  userId: string,
  refreshToken: string | undefined | null,
): Promise<void> {
  if (!refreshToken) return;
  await db.update(users).set({ appleRefreshToken: encrypt(refreshToken) }).where(eq(users.id, userId));
}
