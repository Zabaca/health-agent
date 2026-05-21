import { SignJWT, importPKCS8 } from "jose";

/**
 * Sign in with Apple requires the OAuth client secret to be an ES256 JWT
 * derived from the .p8 key. Computed lazily at runtime from the raw key
 * material (no pre-generated secret to rotate; a deploy/cold start regenerates
 * it so it never approaches the 6-month maximum validity):
 *
 *   AUTH_APPLE_SIGNIN_KEY     — contents of the Sign in with Apple .p8
 *   AUTH_APPLE_TEAM_ID        — Apple Team ID (the JWT `iss`)
 *   AUTH_APPLE_SIGNIN_KEY_ID  — Key ID of the sign-in .p8 (the JWT header `kid`)
 *   AUTH_APPLE_ID             — web Services ID (default JWT `sub` / client_id)
 *   AUTH_APPLE_BUNDLE_ID      — native app bundle ID (client_id for native auth)
 *
 * The secret's `sub` must equal the client_id the token was issued to: the
 * Services ID for web, the bundle ID for native. Memoized per client_id.
 */
const cache = new Map<string, string>();

const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_REVOKE_URL = "https://appleid.apple.com/auth/revoke";
const SIX_MONTHS_SECONDS = 15777000; // Apple's maximum allowed validity.

export async function generateAppleClientSecret(
  clientId: string | undefined = process.env.AUTH_APPLE_ID,
): Promise<string> {
  if (!clientId) return "";
  const hit = cache.get(clientId);
  if (hit) return hit;

  const rawKey = process.env.AUTH_APPLE_SIGNIN_KEY;
  const teamId = process.env.AUTH_APPLE_TEAM_ID;
  const keyId = process.env.AUTH_APPLE_SIGNIN_KEY_ID;

  // Graceful no-op when unconfigured (local dev without Apple set up): return
  // "" so the Apple provider is non-functional instead of throwing at module
  // load (auth.ts awaits this at top level) and taking down all auth.
  if (!rawKey || !teamId || !keyId) return "";

  try {
    const pkcs8 = rawKey.replace(/\\n/g, "\n");
    const key = await importPKCS8(pkcs8, "ES256");
    const now = Math.floor(Date.now() / 1000);
    const secret = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .setExpirationTime(now + SIX_MONTHS_SECONDS)
      .setAudience("https://appleid.apple.com")
      .setSubject(clientId)
      .sign(key);
    cache.set(clientId, secret);
    return secret;
  } catch (err) {
    console.error(
      "[apple-secret] failed to generate Sign in with Apple client secret; Apple sign-in degraded (other providers unaffected)",
      err,
    );
    return "";
  }
}

/**
 * Exchanges a Sign in with Apple authorization code for tokens and returns the
 * refresh_token — stored (encrypted) so we can revoke it at account deletion
 * per App Store guideline 5.1.1(v). `clientId` must be the client the code was
 * issued to (bundle ID for native, Services ID for web). Returns null on any
 * failure; callers treat refresh-token capture as best-effort.
 */
export async function exchangeAppleAuthCode(
  code: string,
  clientId: string | undefined,
): Promise<string | null> {
  if (!clientId) return null;
  const clientSecret = await generateAppleClientSecret(clientId);
  if (!clientSecret) return null;
  try {
    const res = await fetch(APPLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    if (!res.ok) {
      console.error("[apple-secret] auth code exchange failed", res.status);
      return null;
    }
    const json = (await res.json()) as { refresh_token?: string };
    return json.refresh_token ?? null;
  } catch (err) {
    console.error("[apple-secret] auth code exchange error", err);
    return null;
  }
}

/**
 * Revokes a Sign in with Apple refresh token. Best-effort and never throws:
 * tries each configured client_id (native bundle then web Services ID) since we
 * don't track which client issued the stored token. Returns true on success.
 */
export async function revokeAppleToken(token: string): Promise<boolean> {
  const clientIds = [process.env.AUTH_APPLE_BUNDLE_ID, process.env.AUTH_APPLE_ID].filter(
    (c): c is string => !!c,
  );
  for (const clientId of clientIds) {
    const clientSecret = await generateAppleClientSecret(clientId);
    if (!clientSecret) continue;
    try {
      const res = await fetch(APPLE_REVOKE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          token,
          token_type_hint: "refresh_token",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      if (res.ok) return true; // Apple returns 200 with an empty body on success.
      console.error("[apple-secret] revoke attempt failed", clientId, res.status);
    } catch (err) {
      console.error("[apple-secret] revoke error", clientId, err);
    }
  }
  return false;
}
