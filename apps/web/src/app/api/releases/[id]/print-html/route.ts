import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { releases as releasesTable, providers as providersTable } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { decryptPii } from "@/lib/crypto";
import { buildReleaseHtml } from "@/lib/releases/release-print-html";
import { inlineApiFileImages } from "@/lib/releases/inline-files";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { id } = await params;

  const row = await db.query.releases.findFirst({
    where: and(eq(releasesTable.id, id), eq(releasesTable.userId, result.userId)),
    with: { providers: { orderBy: [asc(providersTable.order)] } },
  });

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const release = decryptPii(row) as typeof row;
  const html = await inlineApiFileImages(buildReleaseHtml(release as Parameters<typeof buildReleaseHtml>[0]));

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
