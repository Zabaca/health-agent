/**
 * One-time backfill: app-encrypt existing R2 objects in place.
 *
 * Scans every object in the bucket; any object not already encrypted (no ENC1
 * magic header) is fetched, encrypted with our key, and written back at the
 * same key. Idempotent — already-encrypted objects are skipped, so it's safe
 * to run multiple times.
 *
 * Run with:
 *   bun run migrate:encrypt-files
 */

import { listAllR2Keys, getFromR2, putRawToR2 } from '../src/lib/r2';
import { isEncryptedBuffer, encryptBuffer } from '../src/lib/crypto';

async function main() {
  if (!process.env.ENCRYPTION_KEY) {
    console.error('Error: ENCRYPTION_KEY environment variable is not set.');
    process.exit(1);
  }

  const keys = await listAllR2Keys();
  console.log(`Found ${keys.length} objects.`);

  let encrypted = 0;
  let skipped = 0;
  for (const key of keys) {
    const obj = await getFromR2(key);
    if (!obj.Body) {
      console.log(`  (no body) ${key}`);
      continue;
    }
    const bytes = Buffer.from(await obj.Body.transformToByteArray());
    if (isEncryptedBuffer(bytes)) {
      skipped++;
      continue;
    }
    await putRawToR2(key, encryptBuffer(bytes));
    encrypted++;
    console.log(`  encrypted ${key}`);
  }

  console.log(`\nDone. encrypted=${encrypted} skipped=${skipped} total=${keys.length}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
