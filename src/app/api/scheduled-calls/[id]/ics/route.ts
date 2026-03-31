import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledCalls } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function toIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = await db.query.scheduledCalls.findFirst({ where: eq(scheduledCalls.id, id) });
  if (!call) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const start = new Date(call.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Health Agent//Scheduled Call//EN',
    'BEGIN:VEVENT',
    `UID:${call.id}@healthagent`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    'SUMMARY:Scheduled Call',
    'DESCRIPTION:A health call has been scheduled.',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="scheduled-call-${call.id}.ics"`,
    },
  });
}
