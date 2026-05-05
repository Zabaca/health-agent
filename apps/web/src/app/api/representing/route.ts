import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { resolveUserSession } from "@/lib/session-resolver";

// GET /api/representing — list patients the caller has an accepted PDA relationship with
export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const relations = await db
    .select({
      patientId: patientDesignatedAgents.patientId,
      relationship: patientDesignatedAgents.relationship,
      healthRecordsPermission: patientDesignatedAgents.healthRecordsPermission,
      manageProvidersPermission: patientDesignatedAgents.manageProvidersPermission,
      releasePermission: patientDesignatedAgents.releasePermission,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(patientDesignatedAgents)
    .innerJoin(users, eq(users.id, patientDesignatedAgents.patientId))
    .where(
      and(
        eq(patientDesignatedAgents.agentUserId, result.userId),
        eq(patientDesignatedAgents.status, "accepted"),
      ),
    );

  return NextResponse.json({ patients: relations });
}
