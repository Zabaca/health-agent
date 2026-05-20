import { createPrivateKey, createSign } from "crypto";

/**
 * Sign in with Apple requires the web OAuth client secret to be an ES256 JWT
 * derived from the .p8 key. Computed synchronously using Node's built-in crypto
 * so auth.ts can call this at module level without a top-level await.
 *
 * Env vars:
 *   AUTH_APPLE_SIGNIN_KEY     — contents of the Sign in with Apple .p8 (PEM; newlines may be \n-escaped)
 *   AUTH_APPLE_TEAM_ID        — Apple Team ID (JWT iss)
 *   AUTH_APPLE_SIGNIN_KEY_ID  — Key ID of the .p8 (JWT header kid)
 *   AUTH_APPLE_ID             — Services ID (JWT sub / OAuth client id)
 *
 * Memoized per process — computed once on first call and reused. A deploy /
 * cold start regenerates it, so it never approaches the 6-month maximum validity.
 */
let cached: string | null = null;

function b64url(data: string | Buffer): string {
  const b64 = Buffer.isBuffer(data)
    ? data.toString("base64")
    : Buffer.from(data).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function generateAppleClientSecret(): string {
  if (cached) return cached;

  const rawKey = process.env.AUTH_APPLE_SIGNIN_KEY;
  const teamId = process.env.AUTH_APPLE_TEAM_ID;
  const keyId = process.env.AUTH_APPLE_SIGNIN_KEY_ID;
  const servicesId = process.env.AUTH_APPLE_ID;

  if (!rawKey || !teamId || !keyId || !servicesId) return "";

  try {
    const pkcs8 = rawKey.replace(/\\n/g, "\n");
    const key = createPrivateKey({ key: pkcs8, format: "pem" });

    const now = Math.floor(Date.now() / 1000);
    const SIX_MONTHS_SECONDS = 15777000;

    const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId }));
    const payload = b64url(JSON.stringify({
      iss: teamId,
      iat: now,
      exp: now + SIX_MONTHS_SECONDS,
      aud: "https://appleid.apple.com",
      sub: servicesId,
    }));

    const signingInput = `${header}.${payload}`;
    const signer = createSign("SHA256");
    signer.update(signingInput);
    // ieee-p1363 gives raw r||s (64 bytes) — required by JWT ES256.
    const sig = signer.sign({ key, dsaEncoding: "ieee-p1363" });

    cached = `${signingInput}.${b64url(sig)}`;
    return cached;
  } catch (err) {
    console.error(
      "[apple-secret] failed to generate Sign in with Apple client secret; Apple sign-in disabled (other providers unaffected)",
      err,
    );
    return "";
  }
}
