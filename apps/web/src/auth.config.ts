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
        const email = (profile?.email as string | undefined) ?? user.email;
        if (!sub || !email) return false;

        const dbUser = await upsertOAuthUser(account.provider, sub, email);
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
