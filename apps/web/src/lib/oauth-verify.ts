import { jwtVerify, createRemoteJWKSet, SignJWT } from "jose";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

const APPLE_ISSUER = "https://appleid.apple.com";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

export type VerifiedToken = { sub: string; email: string };

/**
 * Verify an Apple identity token (JWT) by checking the signature against
 * Apple's JWKS, the issuer, the audience (your Apple service id), and the
 * expiry. Returns `{ sub, email }`.
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<VerifiedToken> {
  const audience = process.env.AUTH_APPLE_ID;
  if (!audience) throw new Error("AUTH_APPLE_ID is not configured");

  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience,
  });

  const sub = payload.sub;
  const email = (payload.email as string | undefined) ?? "";
  if (!sub || !email) throw new Error("Apple token missing sub or email");
  return { sub, email };
}

/**
 * Verify a Google ID token (JWT) by checking the signature against Google's
 * JWKS, the issuer (Google may use either the `https://`-prefixed or bare
 * form), the audience (your Google client id), and the expiry.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedToken> {
  const audience = process.env.AUTH_GOOGLE_ID;
  if (!audience) throw new Error("AUTH_GOOGLE_ID is not configured");

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, { audience });

  const iss = payload.iss as string | undefined;
  if (!iss || !GOOGLE_ISSUERS.has(iss)) {
    throw new Error(`Unexpected Google token issuer: ${iss}`);
  }

  const sub = payload.sub;
  const email = (payload.email as string | undefined) ?? "";
  if (!sub || !email) throw new Error("Google token missing sub or email");
  return { sub, email };
}

/**
 * Sign a session JWT for a mobile client. Mobile sends this back as
 * `Authorization: Bearer <token>` on subsequent API calls.
 *
 * Symmetric HS256 with `AUTH_SECRET` so the same secret used by Auth.js for
 * web sessions also signs mobile sessions.
 */
export async function signMobileSessionToken(payload: Record<string, unknown>, ttlSeconds = 60 * 60 * 24 * 30) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");

  const key = new TextEncoder().encode(secret);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(key);
}
