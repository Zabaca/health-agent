/**
 * One-time migration: standardize all date/datetime values to ISO-8601.
 *
 *   - Timestamps  → full ISO UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`):
 *       Session.expires, LinkIntent.expiresAt (were epoch-ms integers, now
 *       numeric strings after migration 0001), IncomingFaxLog.recvdate/starttime,
 *       FaxConfirm.sendtime/completetime (were `YYYY-MM-DD HH:MM:SS`).
 *   - Calendar dates → `YYYY-MM-DD`:
 *       Release.authDate/authExpirationDate, Provider.dateRangeFrom/dateRangeTo
 *       (were MM/DD/YYYY), and the encrypted User.dateOfBirth / Release.dateOfBirth
 *       (decrypt → reparse → re-encrypt).
 *
 * Idempotent: values already in the target format are skipped, so re-running is
 * a no-op. DOB values that can't be parsed (e.g. double-encrypted ciphertext) are
 * left untouched rather than wiped.
 *
 * Run with (local dev):
 *   DATABASE_URL=file:dev.db DATABASE_AUTH_TOKEN=local ENCRYPTION_KEY=… \
 *     bun run scripts/backfill-iso-dates.ts
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';
import { sessions, linkIntents, releases, providers, incomingFaxLog, faxConfirm, users } from '../src/lib/db/schema';
import { encrypt, decrypt } from '../src/lib/crypto';
import { toIsoDate, toIsoTimestamp } from '../src/lib/dates';

const ISO_TS = /^\d{4}-\d{2}-\d{2}T/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns the ISO-timestamp form if conversion is needed, else null (skip). */
function fixTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  if (ISO_TS.test(value)) return null;
  const iso = toIsoTimestamp(value);
  return iso && iso !== value ? iso : null;
}

/** Returns the YYYY-MM-DD form if conversion is needed, else null (skip). */
function fixDate(value: string | null | undefined): string | null {
  if (!value) return null;
  if (ISO_DATE.test(value)) return null;
  const iso = toIsoDate(value);
  return iso && iso !== value ? iso : null;
}

/** Decrypt → normalize → re-encrypt a DOB; null if no change / unparseable. */
function fixEncryptedDob(value: string | null | undefined): string | null {
  if (!value) return null;
  const plain = decrypt(value);
  if (ISO_DATE.test(plain)) return null; // already normalized
  const iso = toIsoDate(plain);
  if (!iso || iso === plain) return null; // unparseable (e.g. double-encrypted) — leave alone
  return encrypt(iso);
}

const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
const db = drizzle(client, { schema });

async function main() {
  if (!process.env.ENCRYPTION_KEY) {
    console.error('Error: ENCRYPTION_KEY environment variable is not set.');
    process.exit(1);
  }

  // Session.expires
  {
    const rows = await db.select({ k: sessions.sessionToken, v: sessions.expires }).from(sessions);
    let n = 0;
    for (const r of rows) {
      const v = fixTimestamp(r.v);
      if (v) { await db.update(sessions).set({ expires: v }).where(eq(sessions.sessionToken, r.k)); n++; }
    }
    console.log(`  Session.expires: ${n} / ${rows.length} updated.`);
  }

  // LinkIntent.expiresAt
  {
    const rows = await db.select({ k: linkIntents.nonce, v: linkIntents.expiresAt }).from(linkIntents);
    let n = 0;
    for (const r of rows) {
      const v = fixTimestamp(r.v);
      if (v) { await db.update(linkIntents).set({ expiresAt: v }).where(eq(linkIntents.nonce, r.k)); n++; }
    }
    console.log(`  LinkIntent.expiresAt: ${n} / ${rows.length} updated.`);
  }

  // Release: authDate, authExpirationDate (dates) + dateOfBirth (encrypted)
  {
    const rows = await db.select({
      id: releases.id, authDate: releases.authDate,
      authExpirationDate: releases.authExpirationDate, dateOfBirth: releases.dateOfBirth,
    }).from(releases);
    let n = 0;
    for (const r of rows) {
      const patch: Partial<typeof releases.$inferInsert> = {};
      const ad = fixDate(r.authDate);             if (ad) patch.authDate = ad;
      const ae = fixDate(r.authExpirationDate);   if (ae) patch.authExpirationDate = ae;
      const dob = fixEncryptedDob(r.dateOfBirth); if (dob) patch.dateOfBirth = dob;
      if (Object.keys(patch).length) { await db.update(releases).set(patch).where(eq(releases.id, r.id)); n++; }
    }
    console.log(`  Release dates: ${n} / ${rows.length} updated.`);
  }

  // Provider: dateRangeFrom, dateRangeTo (dates)
  {
    const rows = await db.select({
      id: providers.id, dateRangeFrom: providers.dateRangeFrom, dateRangeTo: providers.dateRangeTo,
    }).from(providers);
    let n = 0;
    for (const r of rows) {
      const patch: Partial<typeof providers.$inferInsert> = {};
      const from = fixDate(r.dateRangeFrom); if (from) patch.dateRangeFrom = from;
      const to = fixDate(r.dateRangeTo);     if (to) patch.dateRangeTo = to;
      if (Object.keys(patch).length) { await db.update(providers).set(patch).where(eq(providers.id, r.id)); n++; }
    }
    console.log(`  Provider date ranges: ${n} / ${rows.length} updated.`);
  }

  // IncomingFaxLog: recvdate, starttime (timestamps)
  {
    const rows = await db.select({
      id: incomingFaxLog.id, recvdate: incomingFaxLog.recvdate, starttime: incomingFaxLog.starttime,
    }).from(incomingFaxLog);
    let n = 0;
    for (const r of rows) {
      const patch: Partial<typeof incomingFaxLog.$inferInsert> = {};
      const rd = fixTimestamp(r.recvdate);  if (rd) patch.recvdate = rd;
      const st = fixTimestamp(r.starttime); if (st) patch.starttime = st;
      if (Object.keys(patch).length) { await db.update(incomingFaxLog).set(patch).where(eq(incomingFaxLog.id, r.id)); n++; }
    }
    console.log(`  IncomingFaxLog times: ${n} / ${rows.length} updated.`);
  }

  // FaxConfirm: sendtime, completetime (timestamps)
  {
    const rows = await db.select({
      id: faxConfirm.id, sendtime: faxConfirm.sendtime, completetime: faxConfirm.completetime,
    }).from(faxConfirm);
    let n = 0;
    for (const r of rows) {
      const patch: Partial<typeof faxConfirm.$inferInsert> = {};
      const s = fixTimestamp(r.sendtime);     if (s) patch.sendtime = s;
      const c = fixTimestamp(r.completetime); if (c) patch.completetime = c;
      if (Object.keys(patch).length) { await db.update(faxConfirm).set(patch).where(eq(faxConfirm.id, r.id)); n++; }
    }
    console.log(`  FaxConfirm times: ${n} / ${rows.length} updated.`);
  }

  // User.dateOfBirth (encrypted)
  {
    const rows = await db.select({ id: users.id, dateOfBirth: users.dateOfBirth }).from(users);
    let n = 0;
    for (const r of rows) {
      const dob = fixEncryptedDob(r.dateOfBirth);
      if (dob) { await db.update(users).set({ dateOfBirth: dob }).where(eq(users.id, r.id)); n++; }
    }
    console.log(`  User dateOfBirth: ${n} / ${rows.length} updated.`);
  }

  console.log('Backfill complete.');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
