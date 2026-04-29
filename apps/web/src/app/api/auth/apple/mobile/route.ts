import { NextResponse } from "next/server";
import { verifyAppleIdentityToken, signMobileSessionToken } from "@/lib/oauth-verify";
import { upsertOAuthUser } from "@/lib/oauth-link";
import { buildUserSessionPayload } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseDeviceFromBody, recordMobileSession } from "@/lib/mobile-session";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const identityToken = (body as { identityToken?: unknown })?.identityToken;
  if (typeof identityToken !== "string" || !identityToken) {
    return NextResponse.json({ error: "identityToken is required" }, { status: 400 });
  }

  const device = parseDeviceFromBody(body);
  if (!device) {
    return NextResponse.json(
      { error: "Missing or invalid device info (platform must be 'ios' or 'android')" },
      { status: 400 },
    );
  }

  let verified;
  try {
    verified = await verifyAppleIdentityToken(identityToken);
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid Apple identity token", detail: (err as Error).message },
      { status: 401 },
    );
  }

  const dbUser = await upsertOAuthUser("apple", verified.sub, verified.email);
  const fresh = await db.query.users.findFirst({ where: eq(users.id, dbUser.id) });
  if (!fresh) return NextResponse.json({ error: "User not found after upsert" }, { status: 500 });

  const payload = await buildUserSessionPayload(fresh);
  const jti = crypto.randomUUID();
  const sessionToken = await signMobileSessionToken({
    sub: payload.id,
    jti,
    ...payload,
  });

  await recordMobileSession({ jti, userId: payload.id, device, request: req });

  return NextResponse.json({ user: payload, sessionToken });
}
