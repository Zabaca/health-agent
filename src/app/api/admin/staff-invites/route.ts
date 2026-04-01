import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { staffInvites, users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getSiteBaseUrl, sendStaffInviteEmail } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invites = await db.query.staffInvites.findMany({
    where: ne(staffInvites.status, "canceled"),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return NextResponse.json(
    invites.map((i) => ({
      id: i.id,
      firstName: i.firstName,
      lastName: i.lastName,
      email: i.email,
      role: i.role,
      status: i.status,
      tokenExpiresAt: i.tokenExpiresAt,
      createdAt: i.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { firstName, lastName, email, role } = await req.json();

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "First name, last name, and email are required" },
      { status: 400 }
    );
  }

  if (role !== "admin" && role !== "agent") {
    return NextResponse.json({ error: "Role must be admin or agent" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

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
  if (existingInvite) {
    return NextResponse.json(
      { error: "A pending invite for this email already exists" },
      { status: 409 }
    );
  }

  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const tokenExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  await db.insert(staffInvites).values({
    id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    role,
    token,
    tokenExpiresAt,
    invitedById: session.user.id,
  });

  const inviteUrl = `${getSiteBaseUrl()}/staff-invite/${token}`;
  const inviter = await db.query.users.findFirst({ where: eq(users.id, session.user.id) });
  const inviterName = [inviter?.firstName, inviter?.lastName].filter(Boolean).join(" ") || session.user.email || "Zabaca Admin";

  await sendStaffInviteEmail({
    to: normalizedEmail,
    firstName: firstName.trim(),
    role,
    inviteUrl,
    inviterName,
  });

  return NextResponse.json(
    { id, email: normalizedEmail, role, status: "pending", createdAt: new Date().toISOString() },
    { status: 201 }
  );
}
