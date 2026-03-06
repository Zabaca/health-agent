import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
type GlobalDb = { db: DrizzleDB; client: Client };

const globalForDb = globalThis as unknown as { dbState: GlobalDb | undefined };

if (!globalForDb.dbState) {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  globalForDb.dbState = { client, db: drizzle(client, { schema }) };
}

const { client, db: _db } = globalForDb.dbState;

// Set pragmas on the active connection every module load (idempotent)
if (process.env.DATABASE_URL?.startsWith('file:')) {
  client.execute('PRAGMA journal_mode=WAL').catch(() => {});
  client.execute('PRAGMA busy_timeout=10000').catch(() => {});
}

export const db: DrizzleDB = _db;
