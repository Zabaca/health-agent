import type { Config } from 'drizzle-kit';
import { getConfiguration } from './src/lib/config';

const { DATABASE_URL, DATABASE_AUTH_TOKEN } = getConfiguration();

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
