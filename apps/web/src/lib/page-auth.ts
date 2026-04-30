import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import type { Session } from "next-auth";

/**
 * URL that clears the auth cookie then redirects to the given path. Layouts
 * can't modify cookies directly (Next.js restricts that to route handlers /
 * server actions), so we bounce through this endpoint to break the
 * middleware-redirect-loop that would otherwise occur when a stale cookie
 * still trips the "isLoggedIn" check.
 */
const CLEAR_SESSION_REDIRECT = "/api/auth/clear-session?next=/login";

/**
 * Page-level session guard for `(protected)` / `(admin)` / `(agent)` /
 * `(patient-designated-agent)` layouts. Performs the same checks as
 * `requireActiveSession()` but redirects (suitable for server components)
 * instead of returning a JSON 401.
 *
 * Edge middleware can't do these checks because it can't reach the DB —
 * this is the first server-runtime gate that catches revoked / suspended
 * users navigating between pages.
 */
export async function requirePageSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userRow = await db
    .select({ disabled: users.disabled })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();
  if (userRow?.disabled) {
    redirect("/suspended");
  }

  const jti = (session as unknown as Record<string, unknown>).jti as string | undefined;
  if (!jti) {
    redirect(CLEAR_SESSION_REDIRECT);
  }

  const row = await db
    .select({ revokedAt: sessions.revokedAt, expires: sessions.expires })
    .from(sessions)
    .where(eq(sessions.sessionToken, jti))
    .get();
  if (!row || row.revokedAt || row.expires < new Date()) {
    redirect(CLEAR_SESSION_REDIRECT);
  }

  return session;
}
