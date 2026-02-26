import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable, patientAssignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const GET = contractRoute(contract.agent.releaseLookup, async ({ params }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.type !== 'agent') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const release = await db.query.releases.findFirst({
    where: eq(releasesTable.releaseCode, params.code.toUpperCase()),
    columns: {
      id: true,
      releaseCode: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      voided: true,
      authSignatureImage: true,
      userId: true,
    },
  });

  if (!release) {
    return NextResponse.json(null);
  }

  // Agents can only look up releases belonging to their assigned patients
  const assignment = await db.query.patientAssignments.findFirst({
    where: and(
      eq(patientAssignments.patientId, release.userId),
      eq(patientAssignments.assignedToId, session.user.id)
    ),
  });

  if (!assignment) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    id: release.id,
    releaseCode: release.releaseCode,
    firstName: release.firstName,
    lastName: release.lastName,
    createdAt: release.createdAt,
    voided: release.voided,
    authSignatureImage: release.authSignatureImage,
    patientId: release.userId,
  });
});
