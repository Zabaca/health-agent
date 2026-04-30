import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { parseDeviceName } from "@/lib/device-name";
import { extractRequestGeo } from "@/lib/request-geo";

/** 30 days, matches signMobileSessionToken default. */
const MOBILE_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type MobileDeviceInput = {
  name?: string | null;
  platform: "ios" | "android";
};

/**
 * Records a mobile sign-in as a Session row, keyed by the JWT jti. The same
 * row is consulted by the bearer-token guard on subsequent API calls and is
 * what the "Active devices" UI lists / revokes.
 */
export async function recordMobileSession(opts: {
  jti: string;
  userId: string;
  device: MobileDeviceInput;
  request: Request;
}) {
  const { jti, userId, device, request } = opts;
  const userAgent = request.headers.get("user-agent");
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip");
  const deviceName = device.name ?? parseDeviceName(userAgent);
  const geo = extractRequestGeo((name) => request.headers.get(name));
  const now = new Date().toISOString();

  await db
    .insert(sessions)
    .values({
      sessionToken: jti,
      userId,
      expires: new Date(Date.now() + MOBILE_SESSION_TTL_MS),
      platform: device.platform,
      deviceName,
      userAgent,
      ip,
      ...geo,
      lastSeenAt: now,
    })
    .onConflictDoUpdate({
      target: sessions.sessionToken,
      // Don't refresh geo on update — see note in recordWebSession.
      set: { lastSeenAt: now, userAgent, ip, deviceName, platform: device.platform },
    });
}

/**
 * Validates a `device` object from a mobile auth request body. Returns null
 * if invalid. Mobile clients are expected to always send this; the platform
 * field is required.
 */
export function parseDeviceFromBody(body: unknown): MobileDeviceInput | null {
  if (!body || typeof body !== "object") return null;
  const device = (body as { device?: unknown }).device;
  if (!device || typeof device !== "object") return null;
  const platform = (device as { platform?: unknown }).platform;
  if (platform !== "ios" && platform !== "android") return null;
  const name = (device as { name?: unknown }).name;
  return {
    platform,
    name: typeof name === "string" && name.trim() ? name.trim() : null,
  };
}
