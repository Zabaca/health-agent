import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { unlinkProvider } from "@/lib/account-connections";

// DELETE — unlink an OAuth provider from the current account. Blocked unless the
// user has an email+password login to fall back on, so they can't strand
// themselves with only revocable OAuth sign-ins.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { result, error } = await resolveUserSession(req);
  if (error) return error;

  const { provider } = await params;
  if (provider !== "google" && provider !== "apple") {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  }

  const res = await unlinkProvider(result.userId, provider);
  if (!res.ok) {
    if (res.reason === "password_required") {
      return NextResponse.json(
        { error: "Set up an email and password before unlinking. It keeps a sign-in method you won't lose access to." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "That provider isn't linked." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
