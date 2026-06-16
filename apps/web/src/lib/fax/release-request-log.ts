import { db } from "@/lib/db";
import { releaseRequestLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * A client-safe view of a {@link releaseRequestLog} row. Deliberately omits the
 * raw Faxage `apiResponse`/`httpResponse` internals — patient and PDA mobile
 * clients only need to see that a fax was sent and its current status.
 */
export type ReleaseFaxLogEntry = {
  id: string;
  type: "fax";
  status: "success" | "failed" | "awaiting_confirmation";
  faxNumber: string | null;
  recipientName: string | null;
  error: boolean;
  createdAt: string;
};

/** Fetch sanitized fax-request history for a release, newest first. */
export async function getReleaseFaxLog(releaseId: string): Promise<ReleaseFaxLogEntry[]> {
  const logs = await db.query.releaseRequestLog.findMany({
    where: eq(releaseRequestLog.releaseId, releaseId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return logs.map((l) => ({
    id: l.id,
    type: l.type,
    status: l.status,
    faxNumber: l.faxNumber,
    recipientName: l.recipientName,
    error: l.error,
    createdAt: l.createdAt,
  }));
}
