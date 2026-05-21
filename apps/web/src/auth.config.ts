import type { NextAuthConfig } from "next-auth";
import { upsertOAuthUser } from "@/lib/oauth-link";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Email/password — handled inside Credentials.authorize, just allow.
      if (account?.provider === "credentials") return true;

      // OAuth — upsert by Apple/Google sub + email, then mutate user.id so the
      // JWT carries our DB id (not the provider id).
      if (account?.provider === "google" || account?.provider === "apple") {
        const sub = account.providerAccountId;
        if (!sub) return false;

        // Link flow: when a one-shot link intent is pending, the user is ALREADY
        // signed in and attaching this provider — not signing in. Consume the
        // intent and attach the sub to that user. Returning a redirect string
        // short-circuits Auth.js BEFORE a new session is minted, so the existing
        // session is left untouched (no account switch). Lazy imports keep `db`
        // and `next/headers` out of the edge-middleware bundle.
        const { cookies } = await import("next/headers");
        const { consumeLinkIntent, linkProviderSub, safeReturnPath, LINK_NONCE_COOKIE, LINK_RETURN_COOKIE } =
          await import("@/lib/account-connections");
        const jar = await cookies();
        const nonce = jar.get(LINK_NONCE_COOKIE)?.value;
        if (nonce) {
          // Land back on the page that started the link (e.g. /profile or /account).
          const returnTo = safeReturnPath(jar.get(LINK_RETURN_COOKIE)?.value);
          // Clear the one-shot cookies on every exit path. Otherwise a stale
          // cookie (still within its 10-min TTL) would be treated as a pending
          // link on the user's NEXT same-provider OAuth sign-in — its intent row
          // is already consumed, so that legitimate sign-in would be rejected
          // with linkError=expired instead of signing the user in.
          jar.delete(LINK_NONCE_COOKIE);
          jar.delete(LINK_RETURN_COOKIE);
          const intent = await consumeLinkIntent(nonce, account.provider);
          if (!intent) return `${returnTo}?linkError=expired`;
          const res = await linkProviderSub(intent.userId, account.provider, sub);
          if (!res.ok) return `${returnTo}?linkError=conflict`;
          if (account.provider === "apple" && account.refresh_token) {
            const { storeAppleRefreshToken } = await import("@/lib/apple-refresh");
            await storeAppleRefreshToken(intent.userId, account.refresh_token);
          }
          return `${returnTo}?linked=1`;
        }

        const email = (profile?.email as string | undefined) ?? user.email ?? null;

        // Auth.js's Google provider maps `picture` → `user.image`; the Apple
        // provider sets `image: null` (Apple has no avatar). So this is uniform.
        const avatarUrl = (user.image as string | undefined) ?? null;

        // email_verified is a raw provider claim: Google sends a boolean, Apple
        // a "true"/"false" string. Only verified emails may auto-link (handled
        // inside upsertOAuthUser).
        const ev = (profile as Record<string, unknown> | undefined)?.email_verified;
        const emailVerified = ev === true || ev === "true";

        const dbUser = await upsertOAuthUser(account.provider, sub, email, emailVerified, { avatarUrl });
        // Capture the Apple refresh token (web flow already exchanged the code)
        // so account deletion can revoke it. Lazy import keeps Node `crypto` out
        // of the edge-middleware bundle.
        if (account.provider === "apple" && account.refresh_token) {
          const { storeAppleRefreshToken } = await import("@/lib/apple-refresh");
          await storeAppleRefreshToken(dbUser.id, account.refresh_token);
        }
        // Lazy import to avoid circular dep with auth.ts
        const { buildUserSessionPayload } = await import("./auth");
        const payload = await buildUserSessionPayload(dbUser);
        Object.assign(user, payload);
        return true;
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.type = (user as any).type;
        token.isAgent = (user as any).isAgent;
        token.isPda = (user as any).isPda;
        token.isPatient = (user as any).isPatient;
        token.mustChangePassword = (user as any).mustChangePassword;
        token.onboarded = (user as any).onboarded;
        token.disabled = (user as any).disabled;
        // Mint a persistent session id ONCE at sign-in. We can't rely on the
        // standard `jti` claim because Auth.js's encode() calls
        // setJti(crypto.randomUUID()) on every request — `jti` rotates per
        // page load, which would create a new Session row per navigation.
        // `persistentJti` is a custom field that survives encode/decode
        // unchanged.
        token.persistentJti = crypto.randomUUID();
      }
      if (trigger === 'update' && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword;
      }
      if (trigger === 'update' && session?.onboarded !== undefined) {
        token.onboarded = session.onboarded;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.type = token.type as 'admin' | 'user';
      session.user.isAgent = token.isAgent as boolean;
      session.user.isPda = token.isPda as boolean;
      session.user.isPatient = token.isPatient as boolean;
      session.user.mustChangePassword = token.mustChangePassword as boolean;
      session.user.onboarded = token.onboarded as boolean | undefined;
      session.user.disabled = token.disabled as boolean;
      // Surface persistentJti to server-side guards so they can look up the
      // sessions row. (NB: not Auth.js's `jti` — that rotates per request.)
      (session as unknown as Record<string, unknown>).jti = token.persistentJti;
      return session;
    },
  },
} satisfies NextAuthConfig;
