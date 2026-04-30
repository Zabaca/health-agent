import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Session } from "next-auth";

type ActiveSessionResult =
  | { session: Session; error: null }
  | { session: null; error: NextResponse };

/**
 * Checks that the caller has a valid session AND their account is not suspended.
 * Use this in API route handlers instead of calling `auth()` directly.
 *
 * Usage:
 *   const { session, error } = await requireActiveSession();
 *   if (error) return error;
 *
 * Note: we intentionally query the DB here rather than reading session.user.disabled
 * from the JWT. The JWT value reflects the state at login time and would remain stale
 * until the token is refreshed, meaning a suspended user could continue making API
 * calls for the duration of their current session. The DB query ensures suspension
 * takes effect immediately on every request.
 */
export async function requireActiveSession(): Promise<ActiveSessionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const row = await db
    .select({ disabled: users.disabled })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();

  if (row?.disabled) {
    return {
      session: null,
      error: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
    };
  }

  // Session-row revocation check + lastSeenAt update. Cookies without a jti
  // are pre-tracking legacy state — reject them so users re-sign-in once and
  // get a tracked session.
  const jti = (session as unknown as Record<string, unknown>).jti as string | undefined;
  if (!jti) {
    return {
      session: null,
      error: NextResponse.json({ error: "Session expired" }, { status: 401 }),
    };
  }

  const sessionRow = await db
    .select({ revokedAt: sessions.revokedAt, expires: sessions.expires })
    .from(sessions)
    .where(eq(sessions.sessionToken, jti))
    .get();

  // No row = either deleted or never tracked. Treat as revoked.
  if (!sessionRow || sessionRow.revokedAt || sessionRow.expires < new Date()) {
    return {
      session: null,
      error: NextResponse.json({ error: "Session revoked" }, { status: 401 }),
    };
  }

  // Fire-and-forget lastSeenAt bump. Failure here shouldn't fail the request.
  db.update(sessions)
    .set({ lastSeenAt: new Date().toISOString() })
    .where(eq(sessions.sessionToken, jti))
    .run()
    .catch(() => {});

  return { session, error: null };
}
