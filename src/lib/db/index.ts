import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { db: DrizzleDB | undefined };
const client = createClient({ url: process.env.DATABASE_URL! });
export const db: DrizzleDB = globalForDb.db ?? drizzle(client, { schema });
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
