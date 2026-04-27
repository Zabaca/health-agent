import { NextRequest, NextResponse } from 'next/server';
import { requireActiveSession } from '@/lib/auth-guards';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth-helpers';

export async function PUT(req: NextRequest) {
  const { session, error } = await requireActiveSession();
  if (error) return error;

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { password: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!user.password) {
    return NextResponse.json(
      { error: 'This account signs in with a social provider and has no password.' },
      { status: 400 },
    );
  }

  const valid = await verifyPassword(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);
  await db.update(users)
    .set({ password: hashed, mustChangePassword: false })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
