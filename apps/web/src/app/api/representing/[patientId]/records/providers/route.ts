import { NextRequest, NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles, patientDesignatedAgents, releases } from "@/lib/db/schema";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";

// GET /api/representing/[patientId]/records/providers
// Returns unique providers across releases tagged on the patient's records,
// scoped to a PDA who has healthRecordsPermission on that patient.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { patientId } = await params;

  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, result.userId),
      eq(patientDesignatedAgents.patientId, patientId),
      eq(patientDesignatedAgents.status, "accepted"),
    ),
  });

  if (!relation) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!relation.healthRecordsPermission) return NextResponse.json({ error: "No document access" }, { status: 403 });

  // Distinct release codes tagged on this patient's records.
  const tagged = await db
    .select({ releaseCode: incomingFiles.releaseCode })
    .from(incomingFiles)
    .where(
      and(
        eq(incomingFiles.patientId, patientId),
        isNull(incomingFiles.deletedAt),
        isNotNull(incomingFiles.releaseCode),
      ),
    );

  const releaseCodes = Array.from(
    new Set(tagged.map((t) => t.releaseCode).filter((c): c is string => !!c)),
  );

  if (releaseCodes.length === 0) {
    return NextResponse.json({ providers: [] });
  }

  const taggedReleases = await db.query.releases.findMany({
    where: and(
      eq(releases.userId, patientId),
      inArray(releases.releaseCode, releaseCodes),
    ),
    with: {
      providers: {
        columns: { providerName: true, insurance: true, providerType: true },
      },
    },
  });

  const byName = new Map<string, Set<string>>();
  for (const release of taggedReleases) {
    if (!release.releaseCode) continue;
    for (const p of release.providers) {
      const name =
        p.providerType === "Insurance" ? p.insurance || p.providerName : p.providerName;
      if (!name) continue;
      let codes = byName.get(name);
      if (!codes) {
        codes = new Set();
        byName.set(name, codes);
      }
      codes.add(release.releaseCode);
    }
  }

  const providers = Array.from(byName.entries())
    .map(([name, codes]) => ({ name, releaseCodes: Array.from(codes).sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ providers });
}
