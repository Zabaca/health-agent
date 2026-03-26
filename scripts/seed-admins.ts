// scripts/seed-admins.ts
// Passwords are stored as pre-computed bcrypt hashes only.
// Hash was computed via: bun -e "import b from 'bcryptjs'; console.log(await b.hash('GLbdK2qS', 12))"

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/db/schema';
import { users, zabacaAgentRoles } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const HASHED_PASSWORD = '$2a$12$6ASbyzXDOlqdVheReoxYZu64ZRfbFXNiLhsXEJ9PT8EaQ36.H97PO';

const seeds = [
  // Admins
  { firstName: 'Johnny',    lastName: 'Appleseed', phoneNumber: '3231234567', email: 'johnny@zabaca.com', type: 'admin' as const },
  { firstName: 'Mary Jane', lastName: 'Watson',    phoneNumber: '3232134567', email: 'mary@zabaca.com',   type: 'admin' as const },
  // Agents (type='user', agent privilege granted via zabacaAgentRoles)
  { firstName: 'Tim', lastName: 'Apple',   phoneNumber: '3231234567', email: 'tim@agency.com', type: 'user' as const, isAgent: true },
  { firstName: 'May', lastName: 'Weather', phoneNumber: '3232134567', email: 'may@agency.com', type: 'user' as const, isAgent: true },
];

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  for (const seed of seeds) {
    const existing = await db.query.users.findFirst({ where: eq(users.email, seed.email) });
    if (existing) {
      console.log(`Skipping ${seed.email} — already exists`);
      continue;
    }
    const userId = crypto.randomUUID();
    await db.insert(users).values({
      id: userId,
      email: seed.email,
      password: HASHED_PASSWORD,
      type: seed.type,
      mustChangePassword: true,
      firstName: seed.firstName,
      lastName: seed.lastName,
      phoneNumber: seed.phoneNumber,
    });
    if ((seed as any).isAgent) {
      await db.insert(zabacaAgentRoles).values({ id: crypto.randomUUID(), userId });
    }
    console.log(`Created ${seed.type}${(seed as any).isAgent ? ' (agent)' : ''}: ${seed.email}`);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
