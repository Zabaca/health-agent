import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as { type?: string }).type;
  if (role !== 'admin' && role !== 'agent') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { fileURL, fileType, originalName } = await req.json();
  if (!fileURL || !fileType || !originalName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const id = nanoid();
  await db.insert(incomingFiles).values({
    id,
    fileURL,
    fileType,
    source: 'upload',
    incomingFaxLogId: null,
    patientId: null,
  });

  await db.insert(fileUploadLog).values({
    id: nanoid(),
    incomingFileId: id,
    uploadedById: session.user.id,
    originalName,
  });

  return NextResponse.json({ id });
}
