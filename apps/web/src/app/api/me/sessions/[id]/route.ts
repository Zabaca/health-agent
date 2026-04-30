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

  // Scoped delete by both userId and sessionToken so users can't revoke
  // someone else's session.
  const updated = await db
    .update(sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(sessions.sessionToken, id), eq(sessions.userId, result.userId)))
    .returning({ id: sessions.sessionToken });

  if (updated.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, revokedSelf: id === result.currentJti });
}
