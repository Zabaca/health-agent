/**
 * Temp-DB oracle for the E2E harness.
 *
 * The same throwaway SQLite file the test web server writes to is queried here
 * directly (read-only intent) to (a) extract values the flows can't see — most
 * importantly the PDA invite `token` — and (b) assert outcomes after a Maestro
 * journey runs. Uses @libsql/client to match the app's own driver; it's hoisted
 * to the repo-root node_modules so it resolves from anywhere in the workspace.
 */
import { createClient, type Client, type InArgs } from "@libsql/client";

export type Row = Record<string, unknown>;

export function openDb(url: string): Client {
  return createClient({ url });
}

export async function all(db: Client, sql: string, args: InArgs = []): Promise<Row[]> {
  const res = await db.execute({ sql, args });
  return res.rows as unknown as Row[];
}

export async function one(db: Client, sql: string, args: InArgs = []): Promise<Row | null> {
  const rows = await all(db, sql, args);
  return rows[0] ?? null;
}

// ---- Domain helpers (table/column names mirror apps/web/src/lib/db/schema.ts) ----

export function getUserByEmail(db: Client, email: string): Promise<Row | null> {
  return one(db, `SELECT * FROM User WHERE email = ?`, [email]);
}

/** The pending PDA invite row for an invitee email (newest first). */
export function getInvite(db: Client, inviteeEmail: string): Promise<Row | null> {
  return one(
    db,
    `SELECT * FROM PatientDesignatedAgent WHERE inviteeEmail = ? ORDER BY createdAt DESC`,
    [inviteeEmail],
  );
}

export function getProvidersForUser(db: Client, userId: string): Promise<Row[]> {
  return all(db, `SELECT * FROM UserProvider WHERE userId = ?`, [userId]);
}

export function getReleasesForPatient(db: Client, patientId: string): Promise<Row[]> {
  return all(db, `SELECT * FROM Release WHERE userId = ? ORDER BY createdAt DESC`, [patientId]);
}

/** Uploaded document records (source='upload') for a patient, newest first. */
export function getUploadedRecordsForPatient(db: Client, patientId: string): Promise<Row[]> {
  return all(
    db,
    `SELECT * FROM IncomingFile WHERE patientId = ? AND source = 'upload' ORDER BY createdAt DESC`,
    [patientId],
  );
}

/** The upload-log row for a document (records who uploaded it via uploadedById). */
export function getUploadLogForFile(db: Client, incomingFileId: string): Promise<Row | null> {
  return one(db, `SELECT * FROM FileUploadLog WHERE incomingFileId = ?`, [incomingFileId]);
}

/** Tiny assert that prints context and throws on failure. */
export function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`DB assertion failed: ${msg}`);
}
