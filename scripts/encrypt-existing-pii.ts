/**
 * One-time migration: encrypt plain-text SSN and Date of Birth values
 * already stored in the database.
 *
 * Safe to run multiple times — values that are already encrypted
 * (prefixed with "enc:") are skipped.
 *
 * Run with:
 *   bun run migrate:encrypt-pii
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { users, releases } from '../src/lib/db/schema';
import { encrypt } from '../src/lib/crypto';

const ENC_PREFIX = 'enc:';

function needsEncryption(value: string | null | undefined): value is string {
  return !!value && !value.startsWith(ENC_PREFIX);
}

async function main() {
  if (!process.env.ENCRYPTION_KEY) {
    console.error('Error: ENCRYPTION_KEY environment variable is not set.');
    process.exit(1);
  }

  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  // --- Users table ---
  console.log('Processing users table…');
  const allUsers = await db.select({
    id: users.id,
    ssn: users.ssn,
    dateOfBirth: users.dateOfBirth,
  }).from(users);

  let usersUpdated = 0;
  for (const user of allUsers) {
    const patch: { ssn?: string; dateOfBirth?: string } = {};
    if (needsEncryption(user.ssn))         patch.ssn         = encrypt(user.ssn);
    if (needsEncryption(user.dateOfBirth)) patch.dateOfBirth = encrypt(user.dateOfBirth);

    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, user.id));
      usersUpdated++;
      console.log(`  Updated user ${user.id}`);
    }
  }
  console.log(`  ${usersUpdated} / ${allUsers.length} users encrypted.\n`);

  // --- Releases table ---
  console.log('Processing releases table…');
  const allReleases = await db.select({
    id: releases.id,
    ssn: releases.ssn,
    dateOfBirth: releases.dateOfBirth,
  }).from(releases);

  let releasesUpdated = 0;
  for (const release of allReleases) {
    const patch: { ssn?: string; dateOfBirth?: string } = {};
    if (needsEncryption(release.ssn))         patch.ssn         = encrypt(release.ssn);
    if (needsEncryption(release.dateOfBirth)) patch.dateOfBirth = encrypt(release.dateOfBirth);

    if (Object.keys(patch).length > 0) {
      await db.update(releases).set(patch).where(eq(releases.id, release.id));
      releasesUpdated++;
      console.log(`  Updated release ${release.id}`);
    }
  }
  console.log(`  ${releasesUpdated} / ${allReleases.length} releases encrypted.\n`);

  console.log('Migration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
