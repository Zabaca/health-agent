import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${crypto.randomUUID()}-${safeFilename}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `/api/files/${key}`;
}

export async function getFromR2(key: string) {
  return r2.send(new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  }));
}

export async function deleteFromR2(fileURL: string) {
  // fileURL is in the form /api/files/<key>
  const key = fileURL.replace(/^\/api\/files\//, '');
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  }));
}
