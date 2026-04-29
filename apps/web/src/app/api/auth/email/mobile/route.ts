import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { buildUserSessionPayload } from "@/auth";
import { verifyPassword } from "@/lib/auth-helpers";
import { signMobileSessionToken } from "@/lib/oauth-verify";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { parseDeviceFromBody, recordMobileSession } from "@/lib/mobile-session";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body as { email?: unknown })?.email;
  const password = (body as { password?: unknown })?.password;
  if (typeof email !== "string" || !email || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const device = parseDeviceFromBody(body);
  if (!device) {
    return NextResponse.json(
      { error: "Missing or invalid device info (platform must be 'ios' or 'android')" },
      { status: 400 },
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });

  // Use the same response for "no user", "OAuth-only user", and "wrong password"
  // so we don't leak which emails are registered.
  if (!user || !user.password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  if (user.disabled) {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const payload = await buildUserSessionPayload(user);
  const jti = crypto.randomUUID();
  const sessionToken = await signMobileSessionToken({
    sub: payload.id,
    jti,
    ...payload,
  });

  await recordMobileSession({ jti, userId: payload.id, device, request: req });

  return NextResponse.json({ user: payload, sessionToken });
}
