import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getConfiguration } from "./config";
import { encryptBuffer } from "./crypto";

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

  // PHI documents are app-encrypted (our key) before upload — R2 holds opaque
  // ciphertext. We still record the true ContentType as object metadata (a hint
  // only; the bytes are ciphertext) so untracked files (avatars/signatures) with
  // no DB row and no key extension still serve a correct type.
  await getR2Client().send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: encryptBuffer(buffer),
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

/** List every object key in the bucket (paginated). Used by the encryption backfill. */
export async function listAllR2Keys(): Promise<string[]> {
  const { S3_BUCKET } = getConfiguration();
  const client = getR2Client();
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, ContinuationToken: token }));
    for (const o of res.Contents ?? []) if (o.Key) keys.push(o.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** Write raw bytes to a specific key without re-keying or re-encrypting (backfill only). */
export async function putRawToR2(key: string, body: Buffer, contentType = "application/octet-stream"): Promise<void> {
  const { S3_BUCKET } = getConfiguration();
  await getR2Client().send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
}

export async function deleteFromR2(fileURL: string) {
  const { S3_BUCKET } = getConfiguration();
  const key = fileURL.replace(/^\/api\/files\//, '');
  await getR2Client().send(new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  }));
}
