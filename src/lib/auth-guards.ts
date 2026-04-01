import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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

  return { session, error: null };
}
