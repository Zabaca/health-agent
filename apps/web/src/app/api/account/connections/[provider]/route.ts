import { NextResponse } from "next/server";
import { resolveUserSession } from "@/lib/session-resolver";
import { unlinkProvider } from "@/lib/account-connections";

// DELETE — unlink an OAuth provider from the current account. Blocked when it
// would remove the user's only remaining sign-in method.
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
    if (res.reason === "last_method") {
      return NextResponse.json(
        { error: "You can't unlink your only sign-in method. Set a password or link another provider first." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "That provider isn't linked." }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
