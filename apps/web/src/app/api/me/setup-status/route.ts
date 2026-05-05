import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { users, userProviders, patientDesignatedAgents, releases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/me/setup-status — returns account setup completion flags
export async function GET(req: NextRequest) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const userId = result.userId;

  const [user, providers, pdas, releaseRows] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId), columns: { profileComplete: true, firstName: true } }),
    db.query.userProviders.findMany({ where: eq(userProviders.userId, userId), columns: { id: true } }),
    db.query.patientDesignatedAgents.findMany({ where: eq(patientDesignatedAgents.patientId, userId), columns: { id: true } }),
    db.query.releases.findMany({ where: eq(releases.userId, userId), columns: { id: true, voided: true } }),
  ]);

  return NextResponse.json({
    firstName: user?.firstName ?? null,
    profileComplete: user?.profileComplete ?? false,
    providerAdded: providers.length > 0,
    pdaAdded: pdas.length > 0,
    releaseCreated: releaseRows.some(r => !r.voided),
  });
}
