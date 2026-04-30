import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { headers } from "next/headers";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import {
  users,
  sessions,
  zabacaAgentRoles,
  patientDesignatedAgents,
  patientAssignments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth-helpers";
import { parseDeviceName } from "@/lib/device-name";
import { extractRequestGeo } from "@/lib/request-geo";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Builds the role flags + session payload that we attach to the JWT.
 * Used by both the Credentials provider and the signIn callback for OAuth.
 */
export async function buildUserSessionPayload(user: typeof users.$inferSelect) {
  const [agentRole, pdaRelation, patientAssignment] = await Promise.all([
    db.query.zabacaAgentRoles.findFirst({ where: eq(zabacaAgentRoles.userId, user.id) }),
    db.query.patientDesignatedAgents.findFirst({
      where: and(
        eq(patientDesignatedAgents.agentUserId, user.id),
        eq(patientDesignatedAgents.status, 'accepted'),
      ),
      columns: { id: true },
    }),
    db.query.patientAssignments.findFirst({
      where: eq(patientAssignments.patientId, user.id),
      columns: { id: true },
    }),
  ]);

  return {
    id: user.id,
    email: user.email,
    type: user.type,
    isAgent: !!agentRole,
    isPda: !!pdaRelation,
    isPatient: !!patientAssignment,
    mustChangePassword: user.mustChangePassword,
    onboarded: user.onboarded,
    disabled: user.disabled,
  };
}

/**
 * Upserts a web Session row keyed by the JWT's jti claim. Called from the
 * session callback (the only callback that sees the encode-time jti — Auth.js
 * overrides any jti set in the jwt callback via `setJti()` at encode time).
 *
 * Runs on every authenticated request; the upsert keeps lastSeenAt fresh and
 * is a no-op INSERT after the first call.
 */
async function recordWebSession(jti: string, userId: string) {
  const h = await headers();
  const userAgent = h.get("user-agent") ?? null;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const deviceName = parseDeviceName(userAgent);
  const geo = extractRequestGeo((name) => h.get(name));
  const now = new Date().toISOString();

  await db
    .insert(sessions)
    .values({
      sessionToken: jti,
      userId,
      expires: new Date(Date.now() + SESSION_TTL_MS),
      platform: "web",
      deviceName,
      userAgent,
      ip,
      ...geo,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: sessions.sessionToken,
      // Don't refresh geo on every request — pin it to first-seen so
      // location changes (VPN flips, traveling) show as a separate session
      // when the user signs in again. The lastSeenAt bump still happens.
      set: { lastSeenAt: now, userAgent, ip, deviceName },
    });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Wraps the base jwt callback to await the *first* Session row insert
     * synchronously at sign-in (when `user` is present). If the insert fails
     * here, Auth.js treats it as a sign-in error — better than the previous
     * fire-and-forget, which would let the user "sign in" but then loop on
     * the next request because guards reject sessions with no row.
     */
    async jwt(opts) {
      const token = await authConfig.callbacks!.jwt!(opts);
      if (opts.user && token) {
        const persistentJti = (token as Record<string, unknown>).persistentJti as string | undefined;
        const userId = (token as Record<string, unknown>).id as string | undefined;
        if (persistentJti && userId) {
          await recordWebSession(persistentJti, userId);
        }
      }
      return token;
    },
    /**
     * Wraps the lite session callback (in auth.config.ts) to keep `lastSeenAt`
     * fresh. The first row was already inserted in the jwt callback above, so
     * here we only update — failures are logged but don't break the request.
     */
    async session(opts) {
      const session = await authConfig.callbacks!.session!(opts);
      const persistentJti = (opts.token as Record<string, unknown> | undefined)?.persistentJti as string | undefined;
      const userId = session?.user?.id;
      if (persistentJti && userId) {
        recordWebSession(persistentJti, userId).catch((err) => {
          console.error("[auth] recordWebSession failed", { jti: persistentJti, userId, err });
        });
      }
      return session;
    },
  },
  events: {
    /**
     * Soft-revoke the session row on sign-out. The JWT cookie is also cleared
     * by Auth.js; this is for "Active devices" UI bookkeeping + to invalidate
     * any leaked copy of the cookie.
     */
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const persistentJti = (token as Record<string, unknown> | null)?.persistentJti as string | undefined;
      if (!persistentJti) return;
      await db
        .update(sessions)
        .set({ revokedAt: new Date().toISOString() })
        .where(eq(sessions.sessionToken, persistentJti));
    },
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string),
        });

        if (!user) return null;
        // OAuth-only accounts have no password — block email/password sign-in for them.
        if (!user.password) return null;

        const isValid = await verifyPassword(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return buildUserSessionPayload(user);
      },
    }),
  ],
});
