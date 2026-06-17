import { NextResponse } from 'next/server';

/**
 * E2E-only sink for the mobile app's console warnings/errors. The app forwards
 * them here under EXPO_PUBLIC_E2E (see apps/mobile/src/lib/e2eConsole.ts) so the
 * harness can capture them in the test server's log (web.log) for post-run
 * review. Gated by E2E_NO_R2, which only the E2E harness sets — a 404 no-op in
 * any real deployment.
 */
export async function POST(req: Request) {
  if (process.env.E2E_NO_R2 !== '1') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const { level, message } = (await req.json()) as { level?: string; message?: string };
    console.log(`[MOBILE ${String(level ?? 'log').toUpperCase()}] ${message ?? ''}`);
  } catch {
    /* ignore malformed payloads */
  }
  return NextResponse.json({ ok: true });
}
