import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, passwordResetTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { sendPasswordResetEmail, sendOAuthSignInReminderEmail, getSiteBaseUrl } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email } = body as { email?: string };
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
      columns: { id: true, email: true, type: true, password: true, appleId: true, googleId: true },
    });

    // Always return 200 to avoid leaking whether the email exists
    if (!user) return NextResponse.json({ ok: true });

    // Only patients and PDAs — admins and agents use admin-managed resets
    if (user.type === 'admin') return NextResponse.json({ ok: true });

    // Accounts created without an email (e.g. Apple withheld it) have nothing to reset.
    if (!user.email) return NextResponse.json({ ok: true });

    // OAuth-only account (no password): don't let them silently create a password —
    // point them back to the social-login button instead. Same 200 either way.
    if (!user.password && (user.appleId || user.googleId)) {
      try {
        await sendOAuthSignInReminderEmail({
          to: user.email,
          provider: user.appleId ? 'apple' : 'google',
        });
      } catch {
        // swallow — don't leak email delivery failures
      }
      return NextResponse.json({ ok: true });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await db.insert(passwordResetTokens).values({
      id: randomUUID(),
      userId: user.id,
      token,
      expiresAt,
    });

    const resetUrl = `${getSiteBaseUrl()}/reset-password?token=${token}`;
    try {
      await sendPasswordResetEmail({ to: user.email, resetUrl });
    } catch {
      // swallow — don't leak email delivery failures
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
