import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getConfiguration } from "./config";

function getR2Client(): S3Client {
  const { R2_ACCOUNT_ID, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = getConfiguration();
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadToR2(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const { S3_BUCKET } = getConfiguration();
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${crypto.randomUUID()}-${safeFilename}`;

  await getR2Client().send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `/api/files/${key}`;
}

export async function getFromR2(key: string) {
  const { S3_BUCKET } = getConfiguration();
  return getR2Client().send(new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  }));
}

export async function deleteFromR2(fileURL: string) {
  const { S3_BUCKET } = getConfiguration();
  const key = fileURL.replace(/^\/api\/files\//, '');
  await getR2Client().send(new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  }));
}
