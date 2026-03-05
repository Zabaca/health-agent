import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import crypto from 'crypto';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const params = JSON.stringify({
    auth: {
      key: process.env.TRANSLOADIT_KEY!,
      expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
    steps: { ':original': { robot: '/upload/handle' } },
  });

  const signature =
    'sha384:' +
    crypto
      .createHmac('sha384', process.env.TRANSLOADIT_SECRET!)
      .update(Buffer.from(params, 'utf-8'))
      .digest('hex');

  return NextResponse.json({ params, signature });
}
