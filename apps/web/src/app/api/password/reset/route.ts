import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  const { token, password } = await req.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const record = await db.query.passwordResetTokens.findFirst({
    where: and(eq(passwordResetTokens.token, token), isNull(passwordResetTokens.usedAt)),
  });

  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
  }
  if (new Date(record.expiresAt) < new Date()) {
    return NextResponse.json({ error: 'This reset link has expired' }, { status: 400 });
  }

  const hashed = await hashPassword(password);
  await Promise.all([
    db.update(users)
      .set({ password: hashed, mustChangePassword: false })
      .where(eq(users.id, record.userId)),
    db.update(passwordResetTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(passwordResetTokens.id, record.id)),
  ]);

  return NextResponse.json({ ok: true });
}
