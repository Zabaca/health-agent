import { db } from '@/lib/db';
import { zabacaAgentRoles, users } from '@/lib/db/schema';
import { eq, notInArray } from 'drizzle-orm';

/** Returns true if the user has a ZabacaAgentRole row (DB-level check, source of truth). */
export async function isZabacaAgent(userId: string): Promise<boolean> {
  const role = await db.query.zabacaAgentRoles.findFirst({
    where: eq(zabacaAgentRoles.userId, userId),
  });
  return !!role;
}

/** Returns all user IDs that have agent roles. */
export async function getAgentUserIds(): Promise<string[]> {
  const roles = await db.select({ userId: zabacaAgentRoles.userId }).from(zabacaAgentRoles);
  return roles.map(r => r.userId);
}

/**
 * Returns all users who are "patients" — type='user' and NOT a Zabaca agent.
 * Agents are staff; patients are regular users without an agent role.
 */
export async function getPatientUsers() {
  const agentIds = await getAgentUserIds();
  if (agentIds.length === 0) {
    return db.query.users.findMany({ where: eq(users.type, 'user') });
  }
  return db.query.users.findMany({
    where: notInArray(users.id, agentIds),
  });
}
