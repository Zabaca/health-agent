import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { patientDesignatedAgents, users } from "@/lib/db/schema";
import { resolveUserSession } from "@/lib/session-resolver";

// GET /api/representing/pending — pending invites where inviteeEmail === caller's email
export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const me = await db.query.users.findFirst({
    where: eq(users.id, result.userId),
    columns: { email: true },
  });
  // No invite can match a user without an email address.
  if (!me?.email) return NextResponse.json({ invites: [] });

  const rows = await db
    .select({
      id: patientDesignatedAgents.id,
      relationship: patientDesignatedAgents.relationship,
      healthRecordsPermission: patientDesignatedAgents.healthRecordsPermission,
      manageProvidersPermission: patientDesignatedAgents.manageProvidersPermission,
      releasePermission: patientDesignatedAgents.releasePermission,
      createdAt: patientDesignatedAgents.createdAt,
      patientFirstName: users.firstName,
      patientLastName: users.lastName,
      patientEmail: users.email,
    })
    .from(patientDesignatedAgents)
    .innerJoin(users, eq(users.id, patientDesignatedAgents.patientId))
    .where(
      and(
        eq(patientDesignatedAgents.inviteeEmail, me.email),
        eq(patientDesignatedAgents.status, "pending"),
      ),
    );

  return NextResponse.json({ invites: rows });
}
