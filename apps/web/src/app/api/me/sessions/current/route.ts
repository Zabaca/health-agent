import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { resolveUserSession } from "@/lib/session-resolver";
import { requireSameOrigin } from "@/lib/csrf";

export async function DELETE(req: Request) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  if (!result.currentJti) {
    return NextResponse.json({ error: "No active session" }, { status: 400 });
  }

  await db
    .delete(sessions)
    .where(and(eq(sessions.sessionToken, result.currentJti), eq(sessions.userId, result.userId)));

  return NextResponse.json({ success: true });
}
