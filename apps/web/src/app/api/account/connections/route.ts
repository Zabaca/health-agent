import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getConnections } from "@/lib/account-connections";

// GET — sign-in methods on the current account (email/password + linked providers).
export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const user = await db.query.users.findFirst({
    where: eq(users.id, result.userId),
    columns: { email: true, password: true, appleId: true, googleId: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(getConnections(user));
}
