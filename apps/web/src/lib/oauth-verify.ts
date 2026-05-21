import { jwtVerify, createRemoteJWKSet, SignJWT } from "jose";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

const APPLE_ISSUER = "https://appleid.apple.com";
const GOOGLE_ISSUERS = new Set(["https://accounts.google.com", "accounts.google.com"]);

export type VerifiedToken = {
  sub: string;
  email: string | null;
  /** True when the provider asserts the email is verified. Gates account linking. */
  emailVerified: boolean;
  picture: string | null;
};

/**
 * Verify an Apple identity token (JWT) by checking the signature against
 * Apple's JWKS, the issuer, the audience, and the expiry. Returns `{ sub, email }`.
 *
 * The `aud` differs by client: the web (Auth.js) flow uses the Services ID
 * (`AUTH_APPLE_ID`, e.g. com.zabaca.veladon.web), while the native mobile flow
 * uses the app's bundle ID (`AUTH_APPLE_BUNDLE_ID`, e.g. com.zabaca.veladon).
 * Accept either so one deployment serves both surfaces.
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<VerifiedToken> {
  const audience = [process.env.AUTH_APPLE_ID, process.env.AUTH_APPLE_BUNDLE_ID].filter(
    (a): a is string => !!a,
  );
  if (audience.length === 0) {
    throw new Error("Neither AUTH_APPLE_ID nor AUTH_APPLE_BUNDLE_ID is configured");
  }

  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience,
  });

  const sub = payload.sub;
  if (!sub) throw new Error("Apple token missing sub");
  // Apple only includes `email` on the first authorization; returning users
  // have no email claim — look them up by sub (appleId) instead.
  const email = (payload.email as string | undefined) ?? null;
  // Apple verifies both real and relay emails it issues. The claim is a string
  // ("true"/"false") or boolean depending on the token; treat absence as
  // verified since Apple only emits emails it controls.
  const ev = payload.email_verified;
  const emailVerified = email ? ev === undefined || ev === true || ev === "true" : false;
  // Sign in with Apple never returns a profile picture.
  return { sub, email, emailVerified, picture: null };
}

/**
 * Verify a Google ID token (JWT) by checking the signature against Google's
 * JWKS, the issuer (Google may use either the `https://`-prefixed or bare
 * form), the audience, and the expiry.
 *
 * The `aud` is whichever OAuth client initiated the flow: the web client
 * (`AUTH_GOOGLE_ID`) for web sign-in, or the iOS/Android client
 * (`GOOGLE_IOS_CLIENT_ID` / `GOOGLE_ANDROID_CLIENT_ID`) for the native mobile
 * flow. Accept any configured client so one deployment serves all surfaces.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedToken> {
  const audience = [
    process.env.AUTH_GOOGLE_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter((a): a is string => !!a);
  if (audience.length === 0) {
    throw new Error("No Google client IDs configured (AUTH_GOOGLE_ID / GOOGLE_IOS_CLIENT_ID / GOOGLE_ANDROID_CLIENT_ID)");
  }

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, { audience });

  const iss = payload.iss as string | undefined;
  if (!iss || !GOOGLE_ISSUERS.has(iss)) {
    throw new Error(`Unexpected Google token issuer: ${iss}`);
  }

  const sub = payload.sub;
  const email = (payload.email as string | undefined) ?? "";
  if (!sub || !email) throw new Error("Google token missing sub or email");
  // Google encodes email_verified as a boolean (or "true"/"false" string).
  const ev = payload.email_verified;
  const emailVerified = ev === true || ev === "true";
  const picture = (payload.picture as string | undefined) ?? null;
  return { sub, email, emailVerified, picture };
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
