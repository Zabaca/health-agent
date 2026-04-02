import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { staffInvites, users, zabacaAgentRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-helpers";
import { uploadToR2 } from "@/lib/r2";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await db.query.staffInvites.findFirst({
    where: and(eq(staffInvites.token, token), eq(staffInvites.status, "pending")),
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (new Date(invite.tokenExpiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  return NextResponse.json({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    firstName: invite.firstName,
    lastName: invite.lastName,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invite = await db.query.staffInvites.findFirst({
    where: and(eq(staffInvites.token, token), eq(staffInvites.status, "pending")),
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found or already used" }, { status: 404 });
  }

  if (new Date(invite.tokenExpiresAt) < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  // Parse and validate form data before opening the transaction — keeps the
  // critical section short and avoids holding a lock during I/O.
  const formData = await req.formData();
  const firstName = (formData.get("firstName") as string | null)?.trim();
  const lastName = (formData.get("lastName") as string | null)?.trim();
  const address = (formData.get("address") as string | null)?.trim();
  const phoneNumber = (formData.get("phoneNumber") as string | null)?.trim();
  const password = formData.get("password") as string | null;
  const avatarFile = formData.get("avatar") as File | null;

  if (!firstName || !lastName || !address || !phoneNumber || !password) {
    return NextResponse.json(
      { error: "First name, last name, address, phone number, and password are required" },
      { status: 400 }
    );
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  let avatarUrl: string | null = null;
  if (avatarFile && avatarFile.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(avatarFile.type)) {
      return NextResponse.json({ error: "Avatar must be a JPEG, PNG, GIF, or WebP image" }, { status: 400 });
    }
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    avatarUrl = await uploadToR2(buffer, avatarFile.name, avatarFile.type);
  }

  const hashedPassword = await hashPassword(password);
  const userId = crypto.randomUUID();

  // Wrap all DB writes in a transaction so concurrent submissions of the same
  // token cannot both create a user, and a crash mid-way leaves no partial state.
  const result = await db.transaction(async (tx) => {
    // Re-check inside the transaction — the status may have changed since the
    // initial read above (e.g. a concurrent request already accepted this invite).
    const current = await tx.query.staffInvites.findFirst({
      where: and(eq(staffInvites.token, token), eq(staffInvites.status, "pending")),
    });
    if (!current) return "already_used" as const;

    const existingUser = await tx.query.users.findFirst({
      where: eq(users.email, invite.email),
    });
    if (existingUser) return "email_taken" as const;

    await tx.insert(users).values({
      id: userId,
      email: invite.email,
      password: hashedPassword,
      type: invite.role === "admin" ? "admin" : "user",
      mustChangePassword: false,
      onboarded: false,
      firstName,
      lastName,
      address: address || null,
      phoneNumber: phoneNumber || null,
      avatarUrl,
    });

    if (invite.role === "agent") {
      await tx.insert(zabacaAgentRoles).values({
        id: crypto.randomUUID(),
        userId,
      });
    }

    await tx
      .update(staffInvites)
      .set({ status: "accepted", updatedAt: new Date().toISOString() })
      .where(eq(staffInvites.id, invite.id));

    return "ok" as const;
  });

  if (result === "already_used") {
    return NextResponse.json({ error: "Invite not found or already used" }, { status: 404 });
  }
  if (result === "email_taken") {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
