import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { getConfiguration } from '../config';
import * as schema from './schema';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
type GlobalDb = { db: DrizzleDB; client: Client };

const globalForDb = globalThis as unknown as { dbState: GlobalDb | undefined };

function getDbState(): GlobalDb {
  if (!globalForDb.dbState) {
    const { DATABASE_URL, DATABASE_AUTH_TOKEN } = getConfiguration();
    const client = createClient({ url: DATABASE_URL, authToken: DATABASE_AUTH_TOKEN });
    if (DATABASE_URL.startsWith('file:')) {
      client.execute('PRAGMA journal_mode=WAL').catch(() => {});
      client.execute('PRAGMA busy_timeout=10000').catch(() => {});
    }
    globalForDb.dbState = { client, db: drizzle(client, { schema }) };
  }
  return globalForDb.dbState;
}

export const db: DrizzleDB = new Proxy({} as DrizzleDB, {
  get(_, prop) {
    return getDbState().db[prop as keyof DrizzleDB];
  },
});
