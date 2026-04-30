import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { incomingFiles, releases } from "@/lib/db/schema";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";

/**
 * Returns unique providers across the releases that have been tagged on the
 * current user's records. Used to power the MY PROVIDERS pills in the mobile
 * filter sheet.
 *
 * If the same provider name appears across multiple releases, it's emitted
 * once with the union of those release codes — selecting the pill in the UI
 * matches records tagged with any of those codes.
 */
export async function GET(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  // Distinct release codes the user has actually tagged on their records.
  const tagged = await db
    .select({ releaseCode: incomingFiles.releaseCode })
    .from(incomingFiles)
    .where(
      and(
        eq(incomingFiles.patientId, result.userId),
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
      eq(releases.userId, result.userId),
      inArray(releases.releaseCode, releaseCodes),
    ),
    with: {
      providers: {
        columns: { providerName: true, insurance: true, providerType: true },
      },
    },
  });

  // Group by display name → union of releaseCodes.
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
