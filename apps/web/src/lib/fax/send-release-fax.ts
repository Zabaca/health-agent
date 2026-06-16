import { db } from "@/lib/db";
import { getConfiguration } from "@/lib/config";
import { releaseRequestLog } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const FAXAGE_URL = "https://api.faxage.com/httpsfax.php";

// Per-release rate limit: at most one successful/queued fax per release per
// window, regardless of destination number. Enforced via releaseRequestLog so it
// holds across serverless instances. Failed attempts are NOT counted, so a user
// can retry immediately after a bad number rather than being locked out.
const FAX_RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour

export type SendReleaseFaxInput = {
  faxNumber: string;
  /** Base64-encoded PDF document. */
  fileData: string;
  fileName: string;
  releaseId: string;
  recipientName?: string | null;
};

export type SendReleaseFaxResult =
  | { ok: true }
  | { ok: false; error: string; rateLimited?: boolean };

/**
 * Sends a release PDF via Faxage and records the attempt in releaseRequestLog.
 * Shared by the web fax route and the mobile-scoped (patient + PDA) fax routes;
 * callers are responsible for authorizing access to `releaseId` first.
 *
 * Rate-limited to one successful send per release per {@link FAX_RATE_LIMIT_MS}
 * (returns `rateLimited: true` so routes can answer 429).
 */
export async function sendReleaseFax(input: SendReleaseFaxInput): Promise<SendReleaseFaxResult> {
  const { faxNumber, fileData, fileName, releaseId, recipientName } = input;

  // Rate-limit gate: bail before contacting Faxage if this release was faxed
  // (successfully or queued) within the window. Only non-error rows count.
  const lastOk = await db.query.releaseRequestLog.findFirst({
    where: and(eq(releaseRequestLog.releaseId, releaseId), eq(releaseRequestLog.error, false)),
    orderBy: (l, { desc }) => [desc(l.createdAt)],
    columns: { createdAt: true },
  });
  if (lastOk) {
    const elapsed = Date.now() - new Date(lastOk.createdAt).getTime();
    if (elapsed < FAX_RATE_LIMIT_MS) {
      const mins = Math.max(1, Math.ceil((FAX_RATE_LIMIT_MS - elapsed) / 60000));
      return {
        ok: false,
        rateLimited: true,
        error: `This release was faxed recently. Please wait about ${mins} minute${mins === 1 ? "" : "s"} before sending it again.`,
      };
    }
  }

  const { FAXAGE_USERNAME, FAXAGE_COMPANY, FAXAGE_PASSWORD, FAXAGE_NOTIFY_URL } = getConfiguration();

  const params = new URLSearchParams({
    username:          FAXAGE_USERNAME!,
    company:           FAXAGE_COMPANY!,
    password:          FAXAGE_PASSWORD!,
    operation:         "sendfax",
    faxno:             faxNumber,
    recipname:         recipientName ?? "Medical Records",
    "faxfilenames[0]": fileName,
    "faxfiledata[0]":  fileData,
    tagname:           " ",
    tagnumber:         " ",
    callerid:          " ",
    url_notify:        FAXAGE_NOTIFY_URL!,
  });

  let status: "success" | "failed" | "awaiting_confirmation" = "failed";
  let apiResponse: string | null = null;
  let httpResponse: string | null = null;
  let isError = false;

  try {
    const res = await fetch(FAXAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    apiResponse = await res.text();
    httpResponse = JSON.stringify({
      status:     res.status,
      statusText: res.statusText,
      headers:    Object.fromEntries(res.headers.entries()),
      body:       apiResponse,
    });
    // Faxage always returns HTTP 200; detect errors by body prefix (ERRxx:)
    if (!res.ok || /^ERR\d+:/.test(apiResponse.trim())) {
      isError = true;
    } else if (apiResponse.trim().startsWith("JOBID:")) {
      status = "awaiting_confirmation";
    } else {
      // Unexpected body format — treat as error
      isError = true;
    }
  } catch (err) {
    isError = true;
    apiResponse = err instanceof Error ? err.message : String(err);
  }

  // Always log the attempt with the raw apiResponse and full HTTP response object
  await db.insert(releaseRequestLog).values({
    id:            crypto.randomUUID(),
    releaseId,
    type:          "fax",
    service:       "faxage",
    status,
    faxNumber,
    recipientName: recipientName ?? null,
    apiResponse,
    httpResponse,
    error:         isError,
    createdAt:     new Date().toISOString(),
  });

  if (status === "failed") {
    return { ok: false, error: apiResponse ?? "Fax failed" };
  }
  return { ok: true };
}
