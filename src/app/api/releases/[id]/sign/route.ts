import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { releases as releasesTable } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { contractRoute } from "@/lib/api/contract-handler";
import { contract } from "@/lib/api/contract";

export const POST = contractRoute(contract.releases.sign, async ({ params, body }) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.query.releases.findFirst({
    where: and(eq(releasesTable.id, params.id), eq(releasesTable.userId, session.user.id)),
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
      authDate: body.authDate,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(releasesTable.id, params.id));

  return NextResponse.json({ success: true });
});
