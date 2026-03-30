import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { incomingFiles, fileUploadLog } from '@/lib/db/schema';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { fileURL, fileType, originalName, patientId, releaseCode } = await req.json();

  if (!fileURL || !fileType || !originalName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let assignedPatientId: string | null = null;

  if (session.user.type === 'admin' || session.user.isAgent) {
    assignedPatientId = patientId ?? null;
  } else {
    // Regular users (patients/PDAs) always upload to themselves
    assignedPatientId = session.user.id;
  }

  const id = nanoid();
  await db.insert(incomingFiles).values({
    id,
    fileURL,
    fileType,
    source: 'upload',
    incomingFaxLogId: null,
    patientId: assignedPatientId,
    releaseCode: releaseCode ?? null,
  });

  await db.insert(fileUploadLog).values({
    id: nanoid(),
    incomingFileId: id,
    uploadedById: session.user.id,
    originalName,
  });

  return NextResponse.json({ id });
}
