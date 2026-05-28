import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { db } from "@/lib/db";
import { releases as releasesTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";
import { toIsoDate } from "@/lib/dates";

export const POST = contractRoute(contract.releases.sign, async ({ params, body, req }) => {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const existing = await db.query.releases.findFirst({
    where: and(eq(releasesTable.id, params.id), eq(releasesTable.userId, result.userId)),
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.authSignatureImage) {
    return NextResponse.json({ error: "Release is already signed" }, { status: 409 });
  }

  await db
    .update(releasesTable)
    .set({
      authSignatureImage: body.signatureImage,
      authPrintedName: body.printedName,
      authDate: toIsoDate(body.authDate),
      authExpirationDate: toIsoDate(body.expirationDate),
      authExpirationEvent: body.expirationEvent ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(releasesTable.id, params.id));

  return NextResponse.json({ success: true });
});
