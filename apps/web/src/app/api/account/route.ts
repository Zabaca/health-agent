import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { deactivateAccount } from "@/lib/account-deletion";

// DELETE — self-service account deletion (web + mobile). Soft-deletes: revokes
// access + frees login keys now, retains identifiable records for HIPAA, and a
// cron hard-deletes after the retention window. Patients/PDAs only.
export async function DELETE(req: Request) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const res = await deactivateAccount(result.userId);
  if (!res.ok) {
    if (res.reason === "forbidden") {
      return NextResponse.json(
        { error: "This account type can't be self-deleted. Contact an administrator." },
        { status: 403 },
      );
    }
    if (res.reason === "apple_revoke_failed") {
      // Nothing was changed — revoking the Apple sign-in failed, so we aborted.
      return NextResponse.json(
        { error: "We couldn't fully delete your account right now. Please try again in a moment." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
