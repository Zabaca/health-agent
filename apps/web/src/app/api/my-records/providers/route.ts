import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { userProviders } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const providers = await db
    .select({ id: userProviders.id, providerName: userProviders.providerName, providerType: userProviders.providerType, insurance: userProviders.insurance })
    .from(userProviders)
    .where(eq(userProviders.userId, result.userId))
    .orderBy(asc(userProviders.order));

  const out = providers.map((p) => ({
    id: p.id,
    name: p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName,
  }));

  return NextResponse.json({ providers: out });
}
