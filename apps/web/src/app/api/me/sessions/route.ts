import { NextResponse } from "next/server";
import { and, eq, isNull, gt, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { resolveUserSession } from "@/lib/session-resolver";

export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const rows = await db
    .select({
      id: sessions.sessionToken,
      platform: sessions.platform,
      deviceName: sessions.deviceName,
      userAgent: sessions.userAgent,
      ip: sessions.ip,
      country: sessions.country,
      region: sessions.region,
      city: sessions.city,
      latitude: sessions.latitude,
      longitude: sessions.longitude,
      createdAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expires: sessions.expires,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, result.userId),
        isNull(sessions.revokedAt),
        gt(sessions.expires, new Date()),
      ),
    )
    .orderBy(desc(sessions.lastSeenAt));

  return NextResponse.json({
    currentSessionId: result.currentJti,
    sessions: rows.map((r) => ({
      ...r,
      expires: r.expires.toISOString(),
      isCurrent: r.id === result.currentJti,
    })),
  });
}
