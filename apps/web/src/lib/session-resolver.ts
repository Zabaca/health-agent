import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { requireMobileSession } from "@/lib/mobile-auth";

export type ResolvedSession = {
  userId: string;
  currentJti: string | null;
  source: "web" | "mobile";
};

/**
 * Unified session resolver for endpoints that serve both web (NextAuth cookie)
 * and mobile (Authorization: Bearer) callers — e.g. /api/me/sessions.
 *
 * Mobile takes precedence: if an Authorization header is present, we trust
 * it exclusively (don't fall back to cookies). Otherwise we use the NextAuth
 * session cookie.
 */
export async function resolveUserSession(req: Request): Promise<
  { result: ResolvedSession; error: null } | { result: null; error: NextResponse }
> {
  const hasBearer = !!req.headers.get("authorization");

  if (hasBearer) {
    const r = await requireMobileSession(req);
    if (!r.ok) {
      return { result: null, error: NextResponse.json({ error: r.error }, { status: r.status }) };
    }
    return { result: { userId: r.userId, currentJti: r.jti, source: "mobile" }, error: null };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { result: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const jti = (session as unknown as Record<string, unknown>).jti as string | undefined;

  // Same enforcement as requireActiveSession: cookies without a jti, or whose
  // jti has no/revoked/expired Session row, are rejected.
  if (!jti) {
    return { result: null, error: NextResponse.json({ error: "Session expired" }, { status: 401 }) };
  }
  const row = await db
    .select({ revokedAt: sessions.revokedAt, expires: sessions.expires })
    .from(sessions)
    .where(eq(sessions.sessionToken, jti))
    .get();
  if (!row || row.revokedAt || row.expires < new Date()) {
    return { result: null, error: NextResponse.json({ error: "Session revoked" }, { status: 401 }) };
  }

  return { result: { userId: session.user.id, currentJti: jti, source: "web" }, error: null };
}
