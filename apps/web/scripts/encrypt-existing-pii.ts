/**
 * One-time migration: normalize SSN and Date of Birth values in the database.
 *
 * For each record in `users` and `releases`:
 *   1. Encrypt any plain-text SSN/DOB values (legacy records before encryption was added)
 *   2. Truncate any full SSNs to last 4 digits, then re-encrypt
 *
 * Safe to run multiple times:
 *   - Already-encrypted values with 4-digit SSNs are skipped
 *   - Only records that need changes are updated
 *
 * Run with:
 *   bun run migrate:encrypt-pii
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { users, releases } from '../src/lib/db/schema';
import { encrypt, decrypt } from '../src/lib/crypto';

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
    const patch: { ssn?: string | null; dateOfBirth?: string } = {};

    // Encrypt plaintext DOB
    if (needsEncryption(user.dateOfBirth)) {
      patch.dateOfBirth = encrypt(user.dateOfBirth);
    }

    // Normalize SSN: encrypt if plaintext, truncate to last 4 if full SSN
    if (user.ssn) {
      const plaintext = user.ssn.startsWith(ENC_PREFIX) ? decrypt(user.ssn) : user.ssn;
      const digits = plaintext.replace(/\D/g, '');
      if (needsEncryption(user.ssn) || digits.length > 4) {
        patch.ssn = digits.length > 0 ? encrypt(digits.slice(-4)) : null;
      }
    }

    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, user.id));
      usersUpdated++;
      console.log(`  Updated user ${user.id}`);
    }
  }
  console.log(`  ${usersUpdated} / ${allUsers.length} users updated.\n`);

  // --- Releases table ---
  console.log('Processing releases table…');
  const allReleases = await db.select({
    id: releases.id,
    ssn: releases.ssn,
    dateOfBirth: releases.dateOfBirth,
  }).from(releases);

  let releasesUpdated = 0;
  for (const release of allReleases) {
    const patch: { ssn?: string | null; dateOfBirth?: string } = {};

    // Encrypt plaintext DOB
    if (needsEncryption(release.dateOfBirth)) {
      patch.dateOfBirth = encrypt(release.dateOfBirth);
    }

    // Normalize SSN
    if (release.ssn) {
      const plaintext = release.ssn.startsWith(ENC_PREFIX) ? decrypt(release.ssn) : release.ssn;
      const digits = plaintext.replace(/\D/g, '');
      if (needsEncryption(release.ssn) || digits.length > 4) {
        patch.ssn = digits.length > 0 ? encrypt(digits.slice(-4)) : null;
      }
    }

    if (Object.keys(patch).length > 0) {
      await db.update(releases).set(patch).where(eq(releases.id, release.id));
      releasesUpdated++;
      console.log(`  Updated release ${release.id}`);
    }
  }
  console.log(`  ${releasesUpdated} / ${allReleases.length} releases updated.\n`);

  console.log('Migration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
