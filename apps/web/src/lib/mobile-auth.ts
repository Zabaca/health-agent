import { jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";

export type MobileAuthSuccess = {
  ok: true;
  userId: string;
  jti: string;
  type: typeof users.$inferSelect.type;
  isAgent: boolean;
  isPda: boolean;
  isPatient: boolean;
};

export type MobileAuthFailure = {
  ok: false;
  status: 401 | 403;
  error: string;
};

/**
 * Verifies a mobile JWT (Authorization: Bearer ...) and confirms its session
 * row is still valid. Bumps lastSeenAt on success.
 *
 * Tokens were issued by signMobileSessionToken (HS256, AUTH_SECRET). Their
 * jti maps to a Session row inserted at sign-in by recordMobileSession.
 */
export async function requireMobileSession(req: Request): Promise<MobileAuthSuccess | MobileAuthFailure> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401, error: "Missing bearer token" };
  }
  const token = auth.slice(7).trim();
  if (!token) return { ok: false, status: 401, error: "Empty bearer token" };

  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");

  let payload: Record<string, unknown>;
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    payload = verified.payload as Record<string, unknown>;
  } catch {
    return { ok: false, status: 401, error: "Invalid or expired token" };
  }

  const jti = payload.jti as string | undefined;
  const userId = (payload.sub ?? payload.id) as string | undefined;
  if (!jti || !userId) {
    return { ok: false, status: 401, error: "Token missing jti or sub" };
  }

  const row = await db
    .select({
      revokedAt: sessions.revokedAt,
      expires: sessions.expires,
      userId: sessions.userId,
    })
    .from(sessions)
    .where(eq(sessions.sessionToken, jti))
    .get();

  if (!row) return { ok: false, status: 401, error: "Session not found" };
  if (row.revokedAt) return { ok: false, status: 401, error: "Session revoked" };
  if (row.expires < new Date()) return { ok: false, status: 401, error: "Session expired" };
  if (row.userId !== userId) return { ok: false, status: 401, error: "Session/user mismatch" };

  // Account-suspension check (matches requireActiveSession behavior).
  const user = await db
    .select({ disabled: users.disabled })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  if (user?.disabled) return { ok: false, status: 403, error: "Account suspended" };

  // Fire-and-forget lastSeenAt bump.
  db.update(sessions)
    .set({ lastSeenAt: new Date().toISOString() })
    .where(eq(sessions.sessionToken, jti))
    .run()
    .catch(() => {});

  return {
    ok: true,
    userId,
    jti,
    type: payload.type as typeof users.$inferSelect.type,
    isAgent: !!payload.isAgent,
    isPda: !!payload.isPda,
    isPatient: !!payload.isPatient,
  };
}
