/**
 * Restores missing userProviders for a given user by scanning their release history.
 * Usage: bun run scripts/restore-user-providers.ts wasabi@mailinator.com
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/lib/db/schema";
import { users, releases, providers, userProviders } from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun run scripts/restore-user-providers.ts <email>");
  process.exit(1);
}

const client = createClient({ url: process.env.DATABASE_URL!, authToken: process.env.DATABASE_AUTH_TOKEN });
const db = drizzle(client, { schema });

const user = await db.query.users.findFirst({ where: eq(users.email, email) });
if (!user) {
  console.error(`No user found with email: ${email}`);
  process.exit(1);
}
console.log(`User: ${user.firstName} ${user.lastName} (${user.id})`);

// Get current saved providers
const existing = await db.query.userProviders.findMany({ where: eq(userProviders.userId, user.id) });
console.log(`\nCurrent userProviders (${existing.length}):`);
for (const p of existing) {
  console.log(`  [${p.order}] ${p.providerType} — ${p.insurance || p.providerName}`);
}

// Get all providers from release history
const releaseRows = await db.query.releases.findMany({
  where: eq(releases.userId, user.id),
  with: { providers: true },
});

const existingKeys = new Set(existing.map((p) => `${p.providerType}::${p.insurance || p.providerName}`));
const seen = new Set<string>();
const toRestore: typeof schema.userProviders.$inferInsert[] = [];
let order = existing.length;

for (const release of releaseRows) {
  for (const p of release.providers) {
    const key = `${p.providerType}::${p.insurance || p.providerName}`;
    if (!existingKeys.has(key) && !seen.has(key)) {
      seen.add(key);
      toRestore.push({
        id: crypto.randomUUID(),
        userId: user.id,
        order: order++,
        providerName: p.providerName,
        providerType: p.providerType,
        physicianName: p.physicianName,
        patientId: p.patientId,
        insurance: p.insurance,
        patientMemberId: p.patientMemberId,
        groupId: p.groupId,
        planName: p.planName,
        phone: p.phone,
        fax: p.fax,
        providerEmail: p.providerEmail,
        address: p.address,
        membershipIdFront: p.membershipIdFront,
        membershipIdBack: p.membershipIdBack,
      });
    }
  }
}

if (toRestore.length === 0) {
  console.log("\nNothing to restore — all release providers are already in userProviders.");
  process.exit(0);
}

console.log(`\nProviders to restore (${toRestore.length}):`);
for (const p of toRestore) {
  console.log(`  ${p.providerType} — ${p.insurance || p.providerName}`);
}

await db.insert(userProviders).values(toRestore);
console.log("\n✓ Restored successfully.");
