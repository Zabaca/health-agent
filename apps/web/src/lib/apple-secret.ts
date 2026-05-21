import { SignJWT, importPKCS8 } from "jose";

/**
 * Sign in with Apple requires the web OAuth client secret to be an ES256 JWT
 * derived from the .p8 key. Rather than pre-generating and storing it (it
 * expires within 6 months and would need manual rotation), we compute it
 * lazily at runtime from the raw key material:
 *
 *   AUTH_APPLE_SIGNIN_KEY     — contents of the Sign in with Apple .p8
 *                               (PEM; newlines may be `\n`-escaped)
 *   AUTH_APPLE_TEAM_ID        — Apple Team ID (the JWT `iss`); shared team-wide
 *   AUTH_APPLE_SIGNIN_KEY_ID  — Key ID of the sign-in .p8 (the JWT header `kid`)
 *   AUTH_APPLE_ID             — Services ID (the JWT `sub` / OAuth client id)
 *
 * Memoized per process: computed once on first use and reused for the
 * process lifetime. A deploy / cold start regenerates it, so it never
 * approaches the 6-month maximum validity.
 */
let cached: string | null = null;

export async function generateAppleClientSecret(): Promise<string> {
  if (cached) return cached;

  const rawKey = process.env.AUTH_APPLE_SIGNIN_KEY;
  const teamId = process.env.AUTH_APPLE_TEAM_ID;
  const keyId = process.env.AUTH_APPLE_SIGNIN_KEY_ID;
  const servicesId = process.env.AUTH_APPLE_ID;

  // Graceful no-op when unconfigured (e.g. local dev without Apple set up):
  // return "" so the Apple provider is simply non-functional instead of
  // throwing at module load and taking down all auth.
  if (!rawKey || !teamId || !keyId || !servicesId) return "";

  // A malformed key must NOT take down the whole auth module (which is
  // imported at startup via top-level await in auth.ts). Degrade to Apple-only
  // failure: log and return "" so email/password + Google still work.
  try {
    const pkcs8 = rawKey.replace(/\\n/g, "\n");
    const key = await importPKCS8(pkcs8, "ES256");

    const now = Math.floor(Date.now() / 1000);
    const SIX_MONTHS_SECONDS = 15777000; // Apple's maximum allowed validity.

    cached = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: keyId })
      .setIssuer(teamId)
      .setIssuedAt(now)
      .setExpirationTime(now + SIX_MONTHS_SECONDS)
      .setAudience("https://appleid.apple.com")
      .setSubject(servicesId)
      .sign(key);

    return cached;
  } catch (err) {
    console.error(
      "[apple-secret] failed to generate Sign in with Apple client secret; Apple sign-in disabled (other providers unaffected)",
      err,
    );
    return "";
  }
}
