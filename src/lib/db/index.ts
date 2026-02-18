import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> | undefined };
const client = createClient({ url: process.env.DATABASE_URL! });
export const db = globalForDb.db ?? drizzle(client, { schema });
if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
