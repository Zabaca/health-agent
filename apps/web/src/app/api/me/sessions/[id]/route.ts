import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { resolveUserSession } from "@/lib/session-resolver";
import { requireSameOrigin } from "@/lib/csrf";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

  // Hard-delete scoped by userId so users can't remove someone else's session.
  // resolveUserSession treats a missing row as revoked, so deletion is
  // equivalent to marking revokedAt but leaves no orphaned rows.
  const deleted = await db
    .delete(sessions)
    .where(and(eq(sessions.sessionToken, id), eq(sessions.userId, result.userId)))
    .returning({ id: sessions.sessionToken });

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, revokedSelf: id === result.currentJti });
}
