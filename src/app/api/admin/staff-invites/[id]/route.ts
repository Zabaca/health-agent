import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { staffInvites, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSiteBaseUrl, sendStaffInviteEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, newEmail } = body;

  const invite = await db.query.staffInvites.findFirst({
    where: eq(staffInvites.id, id),
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Invite is not pending" }, { status: 400 });
  }

  const newToken = crypto.randomUUID();
  const newTokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const inviter = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  const inviterName = [inviter?.firstName, inviter?.lastName].filter(Boolean).join(" ") || session.user.email || "Zabaca Admin";

  if (action === "resend") {
    await db
      .update(staffInvites)
      .set({ token: newToken, tokenExpiresAt: newTokenExpiresAt, updatedAt: new Date().toISOString() })
      .where(eq(staffInvites.id, id));

    const inviteUrl = `${getSiteBaseUrl()}/staff-invite/${newToken}`;
    await sendStaffInviteEmail({
      to: invite.email,
      firstName: invite.firstName,
      role: invite.role,
      inviteUrl,
      inviterName,
    });

    return NextResponse.json({ success: true });
  }

  if (action === "update-email") {
    if (!newEmail?.trim()) {
      return NextResponse.json({ error: "newEmail is required" }, { status: 400 });
    }
    const normalizedEmail = newEmail.toLowerCase().trim();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const existingInvite = await db.query.staffInvites.findFirst({
      where: and(eq(staffInvites.email, normalizedEmail), eq(staffInvites.status, "pending")),
    });
    if (existingInvite && existingInvite.id !== id) {
      return NextResponse.json(
        { error: "A pending invite for this email already exists" },
        { status: 409 }
      );
    }

    await db
      .update(staffInvites)
      .set({
        email: normalizedEmail,
        token: newToken,
        tokenExpiresAt: newTokenExpiresAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(staffInvites.id, id));

    const inviteUrl = `${getSiteBaseUrl()}/staff-invite/${newToken}`;
    await sendStaffInviteEmail({
      to: normalizedEmail,
      firstName: invite.firstName,
      role: invite.role,
      inviteUrl,
      inviterName,
    });

    return NextResponse.json({ success: true, email: normalizedEmail });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const invite = await db.query.staffInvites.findFirst({
    where: eq(staffInvites.id, id),
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await db
    .update(staffInvites)
    .set({ status: "canceled", updatedAt: new Date().toISOString() })
    .where(eq(staffInvites.id, id));

  return NextResponse.json({ success: true });
}
